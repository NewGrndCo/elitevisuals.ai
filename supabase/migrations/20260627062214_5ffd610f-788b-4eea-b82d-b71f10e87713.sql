
-- Allow multiple purchase rows per Stripe session (cart with multiple items + membership)
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_stripe_session_id_key;
DROP INDEX IF EXISTS public.purchases_stripe_session_id_key;
DROP INDEX IF EXISTS public.purchases_stripe_session_id_idx;

-- Unique per (session, item) so the webhook can safely upsert.
-- Use a generated text key: pack_id::text when set, otherwise 'membership'.
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS item_key TEXT GENERATED ALWAYS AS (COALESCE(pack_id::text, 'membership')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_session_item_unique
  ON public.purchases (stripe_session_id, item_key)
  WHERE stripe_session_id IS NOT NULL;
