
-- 1. Lock down user_roles: only admins can write
CREATE POLICY "Admins manage roles - insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles - update" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles - delete" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated where not needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_prompt_copy(text) FROM PUBLIC, anon;
-- has_role still needed by authenticated for RLS evaluation
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
-- increment_prompt_copy callable by authenticated users only (not anon)
GRANT EXECUTE ON FUNCTION public.increment_prompt_copy(text) TO authenticated;

-- 3. Public bucket: drop broad SELECT policy so files are served via public URL only (no listing)
DROP POLICY IF EXISTS "Public read elite-media files" ON storage.objects;
