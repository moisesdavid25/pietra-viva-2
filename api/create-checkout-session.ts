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

// ── Inline rate limiter (no external imports to avoid Vercel bundling issues) ─
const rlStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = rlStore.get(key);
  if (!b || now > b.resetAt) { rlStore.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}
function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd.split(',')[0]).trim();
  return (req.headers['x-real-ip'] as string | undefined) ?? 'unknown';
}

// ── JWT verification ──────────────────────────────────────────────────────────
async function getAuthenticatedUserId(req: VercelRequest): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  // Rate limit: max 10 checkout attempts per IP per 10 minutes
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra qualche minuto.' });
  }

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

  // For upgrade flows only: verify the caller owns the restaurant
  if (!isRegistration) {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { data: restaurant, error: ownershipErr } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('user_id', userId)
      .maybeSingle();
    if (ownershipErr || !restaurant) {
      return res.status(403).json({ error: 'Forbidden: restaurant not owned by this user' });
    }
  }

  try {
    let customerId: string;

    if (isRegistration) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { registration_pending: 'true' },
      });
      customerId = customer.id;
    } else {
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
