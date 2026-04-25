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
    restaurantId?: string;   // optional — absent on new registration
    userEmail: string;
  };

  if (!priceId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!PRICE_TO_TIER[priceId]) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }

  const appUrl = process.env.APP_URL || 'https://leomenu.it';
  const isRegistration = !restaurantId;

  try {
    let customerId: string;

    if (isRegistration) {
      // ── New registration: create Stripe customer, DO NOT touch Supabase ──
      // Account will be created in /register/complete after payment succeeds
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { registration_pending: 'true' },
      });
      customerId = customer.id;
    } else {
      // ── Existing restaurant upgrade: reuse customer if present ────────────
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('stripe_customer_id')
        .eq('id', restaurantId)
        .single();

      const existing = restaurant?.stripe_customer_id as string | undefined;
      if (existing) {
        customerId = existing;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { restaurantId },
        });
        customerId = customer.id;
        await supabase
          .from('restaurants')
          .update({ stripe_customer_id: customerId })
          .eq('id', restaurantId!);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: isRegistration
        ? { registration_pending: 'true' }
        : { restaurantId: restaurantId! },
      subscription_data: {
        trial_period_days: 14,
        metadata: isRegistration
          ? { registration_pending: 'true' }
          : { restaurantId: restaurantId! },
      },
      // Registration → go to completion page; upgrade → go to gestione
      success_url: isRegistration
        ? `${appUrl}/register/complete?session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/gestione?upgrade=success`,
      cancel_url: isRegistration
        ? `${appUrl}/register`
        : `${appUrl}/prezzi`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
