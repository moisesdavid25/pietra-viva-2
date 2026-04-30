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

// ── Extract and verify the Supabase JWT from the Authorization header ────────
async function getAuthenticatedUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { priceId, restaurantId, userEmail } = req.body as {
    priceId: string;
    restaurantId?: string;
    userEmail: string;
  };

  if (!priceId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!PRICE_TO_TIER[priceId]) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }

  const isRegistration = !restaurantId;
  const appUrl = process.env.APP_URL || 'https://leomenu.it';

  // ── For upgrade flows: verify the caller owns the restaurant ─────────────
  if (!isRegistration) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { data: restaurant, error: ownershipErr } = await supabase
      .from('restaurants')
      .select('id, user_id')
      .eq('id', restaurantId)
      .eq('user_id', userId)   // ← ownership check
      .maybeSingle();
    if (ownershipErr || !restaurant) {
      return res.status(403).json({ error: 'Forbidden: restaurant not owned by this user' });
    }
  }

  try {
    let customerId: string;

    if (isRegistration) {
      // New registration: create Stripe customer only (no Supabase account yet)
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { registration_pending: 'true' },
      });
      customerId = customer.id;
    } else {
      // Upgrade: reuse existing Stripe customer or create one
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
      success_url: isRegistration
        ? `${appUrl}/register/complete?session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/gestione?upgrade=success`,
      cancel_url: isRegistration
        ? `${appUrl}/register`
        : `${appUrl}/prezzi`,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[create-checkout-session]', msg);
    res.status(500).json({ error: msg });
  }
}
