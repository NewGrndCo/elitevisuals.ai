CREATE TABLE public.ai_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_logos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_logos TO authenticated;
GRANT ALL ON public.ai_logos TO service_role;

ALTER TABLE public.ai_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logos public read"
  ON public.ai_logos FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "admins manage ai_logos"
  ON public.ai_logos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ai_logos_touch
  BEFORE UPDATE ON public.ai_logos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();