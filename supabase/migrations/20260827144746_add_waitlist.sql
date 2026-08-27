CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  interests text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_length CHECK (char_length(email) BETWEEN 3 AND 320),
  CONSTRAINT waitlist_name_length CHECK (char_length(name) <= 100),
  CONSTRAINT waitlist_interests_length CHECK (char_length(interests) <= 1000)
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- The public form writes through a validated server function using the
-- service role. Anonymous and authenticated clients receive no table grants.
REVOKE ALL ON public.waitlist_signups FROM anon, authenticated;
GRANT SELECT ON public.waitlist_signups TO authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

CREATE POLICY "admins read waitlist"
  ON public.waitlist_signups FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));
