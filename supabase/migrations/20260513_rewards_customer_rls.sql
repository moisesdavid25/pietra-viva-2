-- Allow any authenticated user to read rewards (needed for customer fidelity app)
-- Without this policy, customers get [] silently because RLS only allows restaurant owners.
-- The owner-level management policies remain unchanged.

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Drop old policy if it exists with a conflicting name, then recreate
DO $$
BEGIN
  -- Allow all authenticated users to SELECT rewards (public catalog)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rewards'
      AND schemaname = 'public'
      AND policyname = 'authenticated_read_rewards'
  ) THEN
    CREATE POLICY "authenticated_read_rewards" ON public.rewards
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow restaurant owners to manage their own rewards (keeps existing behaviour)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rewards'
      AND schemaname = 'public'
      AND policyname = 'manage_own_rewards'
  ) THEN
    CREATE POLICY "manage_own_rewards" ON public.rewards
      FOR ALL
      USING (
        restaurant_id IN (
          SELECT id FROM public.restaurants WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
