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

// ── Inline rate limiter ───────────────────────────────────────────────────────
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

  // Rate limit: max 5 completion attempts per IP per 10 minutes
  if (!rateLimit(`complete-reg:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra qualche minuto.' });
  }

  const { sessionId, restaurantId } = req.body as {
    sessionId: string;
    restaurantId: string;
  };

  if (!sessionId || !restaurantId) {
    return res.status(400).json({ error: 'Missing sessionId or restaurantId' });
  }

  // Verify the caller owns this restaurant
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { data: owned, error: ownershipErr } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownershipErr || !owned) {
    return res.status(403).json({ error: 'Forbidden: restaurant not owned by this user' });
  }

  try {
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
    const endsAt  = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString();
    const subStatus = subscription.status;

    await stripe.subscriptions.update(subscription.id, { metadata: { restaurantId } });
    await stripe.customers.update(session.customer as string, { metadata: { restaurantId } });

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: subscription.id,
        subscription_tier:      tier,
        subscription_status:    subStatus,
        subscription_ends_at:   endsAt,
      })
      .eq('id', restaurantId);

    if (updateError) throw updateError;

    res.json({ success: true, tier, status: subStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[complete-registration]', msg);
    res.status(500).json({ error: msg });
  }
}
