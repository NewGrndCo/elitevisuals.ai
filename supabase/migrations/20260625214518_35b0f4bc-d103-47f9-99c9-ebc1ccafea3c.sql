-- 1. Add price + shopify variant to packs
ALTER TABLE public.packs
  ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 4900,
  ADD COLUMN IF NOT EXISTS shopify_variant_id TEXT;

-- 2. Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
  shopify_order_id TEXT,
  is_membership BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all purchases"
  ON public.purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_pack_id_idx ON public.purchases(pack_id);