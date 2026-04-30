/**
 * _rateLimit.ts
 *
 * Simple in-memory rate limiter for Vercel Edge functions.
 * Resets per cold-start (acceptable for a SaaS of this scale).
 * Use for protecting Stripe and auth-sensitive endpoints.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

// One store per endpoint (module-level singleton per Vercel function instance)
const store = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key        IP address or other identifier
 * @param max        Max requests per window
 * @param windowMs   Window size in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/**
 * Extracts the real client IP from Vercel request headers.
 * Falls back to 'unknown' if not determinable.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return (headers['x-real-ip'] as string | undefined) ?? 'unknown';
}
