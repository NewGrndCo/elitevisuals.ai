
-- Function security
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- admin_whitelist policies
CREATE POLICY "admins read whitelist" ON public.admin_whitelist FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage whitelist" ON public.admin_whitelist FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Restrict storage listing: drop broad SELECT and require specific path access
DROP POLICY IF EXISTS "Public read elite-media" ON storage.objects;
CREATE POLICY "Public read elite-media files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'elite-media');
