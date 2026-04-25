-- ─────────────────────────────────────────────────────────────────────────────
-- Stripe columns on restaurants table
-- Safe to run multiple times (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS subscription_ends_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at           TIMESTAMPTZ;

-- Index for admin queries filtering by status
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status
  ON public.restaurants (subscription_status);

CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_ends
  ON public.restaurants (subscription_ends_at);
