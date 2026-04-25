import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICE_TO_TIER: Record<string, string> = {
  'price_1TJu471OtlBFS4a5EWfn6XOi': 'mensile',
  'price_1TJu701OtlBFS4a50PJvWBGI': 'semestrale',
  'price_1TJu7u1OtlBFS4a5zRuVahso': 'annuale',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { sessionId, restaurantId } = req.body as {
    sessionId: string;
    restaurantId: string;
  };

  if (!sessionId || !restaurantId) {
    return res.status(400).json({ error: 'Missing sessionId or restaurantId' });
  }

  try {
    // Retrieve the completed checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.status !== 'complete') {
      return res.status(400).json({ error: 'Session not completed' });
    }

    const subscription = session.subscription as Stripe.Subscription;
    if (!subscription) {
      return res.status(400).json({ error: 'No subscription found in session' });
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const tier    = PRICE_TO_TIER[priceId] ?? 'mensile';
    const endsAt  = new Date((subscription as any).current_period_end * 1000).toISOString();
    const status  = subscription.status;

    // Update Stripe subscription + customer metadata with restaurantId
    // so future webhook events (renewals, failures) are linked correctly
    await stripe.subscriptions.update(subscription.id, {
      metadata: { restaurantId },
    });
    await stripe.customers.update(session.customer as string, {
      metadata: { restaurantId },
    });

    // Update restaurant record with Stripe data
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_tier:      tier,
        subscription_status:    status,
        subscription_ends_at:   endsAt,
      })
      .eq('id', restaurantId);

    if (updateError) throw updateError;

    res.json({ success: true, tier, status });
  } catch (err: any) {
    console.error('complete-registration error:', err);
    res.status(500).json({ error: err.message });
  }
}
