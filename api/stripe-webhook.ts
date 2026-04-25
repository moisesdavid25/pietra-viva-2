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

// Vercel buffers the body — we need the raw buffer for Stripe signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' });

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const restaurantId = session.metadata?.restaurantId;
        const subscriptionId = session.subscription as string;

        if (restaurantId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
          const priceId = subscription.items.data[0]?.price.id;
          const tier    = PRICE_TO_TIER[priceId] ?? 'mensile';
          const endsAt  = new Date(subscription.current_period_end * 1000).toISOString();
          const status  = subscription.status as string; // 'active' | 'trialing' | ...

          await supabase
            .from('restaurants')
            .update({
              subscription_tier:          tier,
              subscription_status:        status,
              stripe_subscription_id:     subscriptionId,
              stripe_customer_id:         session.customer as string,
              subscription_ends_at:       endsAt,
            })
            .eq('id', restaurantId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const restaurantId = subscription.metadata?.restaurantId;
        if (!restaurantId) break;

        const priceId    = subscription.items.data[0]?.price.id;
        const tier       = PRICE_TO_TIER[priceId] ?? 'mensile';
        const endsAt     = new Date(subscription.current_period_end * 1000).toISOString();
        const status     = subscription.status as string;

        // Downgrade tier if payment failed or cancelled
        const activeTier = ['active', 'trialing'].includes(status) ? tier : 'trial';

        await supabase
          .from('restaurants')
          .update({
            subscription_tier:      activeTier,
            subscription_status:    status,
            stripe_subscription_id: subscription.id,
            subscription_ends_at:   endsAt,
          })
          .eq('id', restaurantId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const restaurantId = subscription.metadata?.restaurantId;
        if (!restaurantId) break;

        await supabase
          .from('restaurants')
          .update({
            subscription_tier:      'trial',
            subscription_status:    'canceled',
            stripe_subscription_id: null,
            subscription_ends_at:   null,
          })
          .eq('id', restaurantId);
        break;
      }

      // Payment failed — mark as past_due without downgrading tier immediately
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        if (!customerId) break;

        await supabase
          .from('restaurants')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // Payment succeeded after past_due — restore active
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        if (invoice.billing_reason === 'subscription_create') break; // handled by checkout.session.completed
        const customerId = invoice.customer as string;
        if (!customerId) break;

        await supabase
          .from('restaurants')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
          .eq('subscription_status', 'past_due'); // only restore if it was past_due
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
