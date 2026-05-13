-- Add customer identity and pickup code to orders
-- auth_user_id: links the order to the fidelity customer who placed it (nullable — anon orders still allowed)
-- pickup_code: 4-char code shown to the customer for asporto pickup verification

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS auth_user_id TEXT,
  ADD COLUMN IF NOT EXISTS pickup_code  TEXT;

-- Index for fast lookup by customer
CREATE INDEX IF NOT EXISTS orders_auth_user_id_idx ON public.orders (auth_user_id);
