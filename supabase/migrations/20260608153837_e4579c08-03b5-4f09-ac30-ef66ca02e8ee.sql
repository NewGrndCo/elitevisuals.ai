-- Create packs table
CREATE TABLE IF NOT EXISTS public.packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packs TO authenticated;
GRANT ALL ON public.packs TO service_role;

ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packs public read" ON public.packs;
CREATE POLICY "packs public read" ON public.packs FOR SELECT TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admins manage packs" ON public.packs;
CREATE POLICY "admins manage packs" ON public.packs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS touch_packs ON public.packs;
CREATE TRIGGER touch_packs BEFORE UPDATE ON public.packs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed Kinetic V1 pack
INSERT INTO public.packs (slug, title, description, sort_order)
VALUES (
  'kinetic-v1',
  'Kinetic V1 Prompt Pack',
  'Twenty cinematic prompts across four motion styles — temporal, particle, fluid, and energy. Paste into any modern AI video model to turn a still frame into a kinetic shot.',
  0
) ON CONFLICT (slug) DO NOTHING;

-- Add pack_id to prompts
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS pack_id uuid REFERENCES public.packs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS prompts_pack_id_idx ON public.prompts(pack_id);

-- Backfill all existing prompts to the kinetic-v1 pack
UPDATE public.prompts
SET pack_id = (SELECT id FROM public.packs WHERE slug = 'kinetic-v1')
WHERE pack_id IS NULL;