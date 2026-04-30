-- ── user_sessions: tracks active sessions per user ──────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_fingerprint TEXT        NOT NULL,          -- random ID stored in localStorage
  device_label        TEXT,                          -- "Chrome su Windows"
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_fingerprint)
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active
  ON public.user_sessions (last_active_at DESC);

-- ── auth_events: immutable audit log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type     TEXT        NOT NULL
    CHECK (event_type IN (
      'login', 'logout', 'login_failed',
      'password_changed', 'email_changed',
      'session_revoked', 'account_deleted'
    )),
  user_agent_hint TEXT,                              -- first 120 chars of User-Agent
  metadata        JSONB       DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own events; admins can read all
CREATE POLICY "users_insert_own_events" ON public.auth_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_select_own_events" ON public.auth_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_select_all_events" ON public.auth_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id
  ON public.auth_events (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at
  ON public.auth_events (created_at DESC);

-- ── Cleanup function: remove sessions inactive > 30 days ─────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE last_active_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
