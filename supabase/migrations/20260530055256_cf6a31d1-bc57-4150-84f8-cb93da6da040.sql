ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS copy_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_prompt_copy(_slug text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.prompts
  SET copy_count = copy_count + 1
  WHERE slug = _slug AND is_published = true
  RETURNING copy_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_prompt_copy(text) TO anon, authenticated;