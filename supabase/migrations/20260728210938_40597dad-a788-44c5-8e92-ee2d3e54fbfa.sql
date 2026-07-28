-- Fix idempotent purchase upserts.
-- The previous index was partial (WHERE stripe_session_id IS NOT NULL), so
-- Postgres could not infer it for "ON CONFLICT (stripe_session_id, item_key)"
-- and every webhook / confirm write failed. A plain unique index behaves
-- identically for de-duplication (NULLs are distinct by default) and IS
-- inferable by ON CONFLICT.
DROP INDEX IF EXISTS public.purchases_session_item_unique;

CREATE UNIQUE INDEX purchases_session_item_unique
  ON public.purchases (stripe_session_id, item_key);