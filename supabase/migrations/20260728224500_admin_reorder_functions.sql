-- Atomic reordering for admin-managed lists.
--
-- The admin UI previously reordered by firing two independent UPDATE
-- statements to swap a pair of rows. A partial failure left the list in a
-- corrupted order, and there was no way to reorder more than one step at a
-- time. Each function below rewrites the whole ordering in a single
-- statement, so it either fully applies or not at all.
--
-- All are SECURITY DEFINER and gated on has_role(auth.uid(),'admin'), and
-- EXECUTE is granted to authenticated only (never anon).

CREATE OR REPLACE FUNCTION public.reorder_packs(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.packs p
  SET sort_order = o.ord
  FROM unnest(_ids) WITH ORDINALITY AS o(id, ord)
  WHERE p.id = o.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_prompts(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.prompts p
  SET sort_order = o.ord
  FROM unnest(_ids) WITH ORDINALITY AS o(id, ord)
  WHERE p.id = o.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_categories(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.categories c
  SET sort_order = o.ord
  FROM unnest(_ids) WITH ORDINALITY AS o(id, ord)
  WHERE c.id = o.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_ai_logos(_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.ai_logos l
  SET sort_order = o.ord
  FROM unnest(_ids) WITH ORDINALITY AS o(id, ord)
  WHERE l.id = o.id;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_packs(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_prompts(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_categories(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_ai_logos(uuid[]) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.reorder_packs(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_prompts(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_categories(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_ai_logos(uuid[]) TO authenticated;
