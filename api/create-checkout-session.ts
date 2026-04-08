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

  const { priceId, restaurantId, userEmail } = req.body as {
    priceId: string;
    restaurantId: string;
    userEmail: string;
  };

  if (!priceId || !restaurantId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!PRICE_TO_TIER[priceId]) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }

  try {
    // Reuse existing Stripe customer if present
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('stripe_customer_id')
      .eq('id', restaurantId)
      .single();

    let customerId = restaurant?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { restaurantId },
      });
      customerId = customer.id;

      await supabase
        .from('restaurants')
        .update({ stripe_customer_id: customerId })
        .eq('id', restaurantId);
    }

    const appUrl = process.env.APP_URL || 'https://leomenu.it';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { restaurantId },
      subscription_data: {
        trial_period_days: 14,
        metadata: { restaurantId },
      },
      success_url: `${appUrl}/gestione?upgrade=success`,
      cancel_url: `${appUrl}/prezzi`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
