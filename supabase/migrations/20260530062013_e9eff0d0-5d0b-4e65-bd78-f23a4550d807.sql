CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content public read" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage site_content" ON public.site_content FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_site_content BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_content (key, value) VALUES
  ('hero', jsonb_build_object(
    'badge', 'EVKT1',
    'badge_label', 'Kinetic V1 Prompt Pack',
    'headline', 'The best AI transitions for video editors.',
    'subhead', 'A curated library of image-to-video prompts engineered to create cinematic motion and transformation effects across modern AI video generation platforms.',
    'cta_primary', 'Explore the Library',
    'cta_secondary', 'Watch demo'
  )),
  ('library', jsonb_build_object(
    'title', 'KINETIC V1 PROMPT PACK',
    'description', 'Browse every prompt by motion style. Tap a card for the full prompt, gallery, and demo video.'
  )),
  ('footer', jsonb_build_object(
    'copyright', '© Elite Visuals. All prompts crafted in the dark.',
    'tagline', 'Premium AI visual prompts.'
  ));