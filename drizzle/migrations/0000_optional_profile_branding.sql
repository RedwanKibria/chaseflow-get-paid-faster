ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS logo_path text;
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS branding_onboarded boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.save_workspace_profile(p_full_name text, p_company_name text, p_currency text, p_logo_path text, p_branding_onboarded boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_active_user() THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF p_logo_path IS NOT NULL AND split_part(p_logo_path, '/', 1) <> auth.uid()::text THEN RAISE EXCEPTION 'Logo must belong to your account'; END IF;
 UPDATE public.users_profile SET full_name=p_full_name, company_name=p_company_name, currency=p_currency, logo_path=p_logo_path, branding_onboarded=p_branding_onboarded, updated_at=now() WHERE id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.save_workspace_profile(text,text,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_workspace_profile(text,text,text,text,boolean) TO authenticated;
COMMENT ON COLUMN public.users_profile.plan IS 'DEPRECATED: all application features are available without a paid plan';
COMMENT ON COLUMN public.user_page_permissions.pro_plan IS 'DEPRECATED: paid plan page has been removed';
COMMENT ON TABLE public.subscriptions IS 'DEPRECATED: no application billing or subscriptions are active';