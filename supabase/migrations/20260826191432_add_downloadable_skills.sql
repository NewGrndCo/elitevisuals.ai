-- EliteVisuals.ai V2 downloadable skills.
-- Additive only: existing prompts, packs, purchases, users, and media are untouched.

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  compatibility text[] NOT NULL DEFAULT ARRAY['Codex', 'ChatGPT']::text[],
  install_instructions text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skill_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  version text NOT NULL CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$'),
  changelog text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (skill_id, version),
  UNIQUE (storage_path)
);

CREATE TABLE public.skill_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('free', 'purchase', 'membership', 'admin')),
  stripe_session_id text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE TABLE public.skill_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.skill_versions(id) ON DELETE RESTRICT,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX skills_public_order_idx ON public.skills (is_published, sort_order, created_at DESC);
CREATE INDEX skill_versions_skill_idx ON public.skill_versions (skill_id, is_published, created_at DESC);
CREATE INDEX skill_entitlements_user_idx ON public.skill_entitlements (user_id, granted_at DESC);
CREATE INDEX skill_downloads_user_idx ON public.skill_downloads (user_id, downloaded_at DESC);
CREATE INDEX skill_downloads_skill_idx ON public.skill_downloads (skill_id, downloaded_at DESC);

CREATE TRIGGER skills_touch
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_downloads ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.skills TO anon, authenticated;
GRANT SELECT ON public.skill_versions TO anon, authenticated;
GRANT SELECT ON public.skill_entitlements, public.skill_downloads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills, public.skill_versions TO authenticated;
GRANT ALL ON public.skills, public.skill_versions, public.skill_entitlements, public.skill_downloads TO service_role;

CREATE POLICY "published skills are public"
  ON public.skills FOR SELECT TO anon, authenticated
  USING (is_published OR public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "admins manage skills"
  ON public.skills FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "published skill versions are public metadata"
  ON public.skill_versions FOR SELECT TO anon, authenticated
  USING (
    (is_published AND EXISTS (
      SELECT 1 FROM public.skills s
      WHERE s.id = skill_id AND s.is_published
    ))
    OR public.has_role((SELECT auth.uid()), 'admin')
  );

CREATE POLICY "admins manage skill versions"
  ON public.skill_versions FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "users read own skill entitlements"
  ON public.skill_entitlements FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users read own skill downloads"
  ON public.skill_downloads FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ZIP archives are never public. The application server performs an
-- entitlement check and returns a short-lived signed URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skill-packages',
  'skill-packages',
  false,
  52428800,
  ARRAY['application/zip', 'application/x-zip-compressed']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "admins upload skill packages"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'skill-packages'
    AND public.has_role((SELECT auth.uid()), 'admin')
  );

CREATE POLICY "admins read skill packages"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'skill-packages'
    AND public.has_role((SELECT auth.uid()), 'admin')
  );

CREATE POLICY "admins update skill packages"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'skill-packages'
    AND public.has_role((SELECT auth.uid()), 'admin')
  )
  WITH CHECK (
    bucket_id = 'skill-packages'
    AND public.has_role((SELECT auth.uid()), 'admin')
  );

CREATE POLICY "admins delete skill packages"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'skill-packages'
    AND public.has_role((SELECT auth.uid()), 'admin')
  );
