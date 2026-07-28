-- Brute-force protection for the admin PIN gate.
--
-- The PIN endpoint was previously unauthenticated and unthrottled over a
-- 10,000-value keyspace, and a correct guess mints a full Supabase admin
-- session. This adds durable, server-side attempt tracking.
--
-- State lives in Postgres rather than worker memory because Cloudflare
-- Workers isolates are short-lived and per-region — an in-memory counter
-- resets constantly and is trivially bypassed.

CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  key           TEXT PRIMARY KEY,          -- 'ip:<addr>' or 'global'
  attempts      INT NOT NULL DEFAULT 0,
  lockouts      INT NOT NULL DEFAULT 0,    -- drives escalating backoff
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service role only. No grants to anon/authenticated, and RLS on with no
-- policies so nothing but the service role (which bypasses RLS) can read
-- or write it.
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_login_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_login_attempts TO service_role;

/**
 * Returns seconds remaining on a lockout, or 0 if the caller may attempt.
 */
CREATE OR REPLACE FUNCTION public.admin_login_precheck(_key TEXT)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row public.admin_login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO row FROM public.admin_login_attempts WHERE key = _key;
  IF NOT FOUND OR row.locked_until IS NULL OR row.locked_until <= now() THEN
    RETURN 0;
  END IF;
  RETURN GREATEST(1, CEIL(EXTRACT(EPOCH FROM (row.locked_until - now())))::INT);
END;
$$;

/**
 * Records the outcome of an attempt and applies lockouts.
 *
 * _max_attempts failures inside a 15-minute window trigger a lockout that
 * doubles each time (5, 10, 20 … capped at 60 minutes). Success clears the
 * record entirely.
 */
CREATE OR REPLACE FUNCTION public.admin_login_record(
  _key TEXT,
  _success BOOLEAN,
  _max_attempts INT DEFAULT 5
)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  row           public.admin_login_attempts%ROWTYPE;
  window_len    INTERVAL := INTERVAL '15 minutes';
  lock_minutes  INT;
BEGIN
  IF _success THEN
    DELETE FROM public.admin_login_attempts WHERE key = _key;
    RETURN 0;
  END IF;

  INSERT INTO public.admin_login_attempts AS a (key, attempts, window_start, updated_at)
  VALUES (_key, 1, now(), now())
  ON CONFLICT (key) DO UPDATE SET
    -- Reset the counter if the previous window has expired.
    attempts = CASE
      WHEN a.window_start < now() - window_len THEN 1
      ELSE a.attempts + 1
    END,
    window_start = CASE
      WHEN a.window_start < now() - window_len THEN now()
      ELSE a.window_start
    END,
    updated_at = now()
  RETURNING * INTO row;

  IF row.attempts >= _max_attempts THEN
    lock_minutes := LEAST(60, 5 * POWER(2, LEAST(row.lockouts, 4))::INT);
    UPDATE public.admin_login_attempts
    SET locked_until = now() + (lock_minutes || ' minutes')::INTERVAL,
        lockouts = lockouts + 1,
        attempts = 0,
        window_start = now(),
        updated_at = now()
    WHERE key = _key;
    RETURN lock_minutes * 60;
  END IF;

  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_login_precheck(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_login_record(TEXT, BOOLEAN, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_login_precheck(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_login_record(TEXT, BOOLEAN, INT) TO service_role;
