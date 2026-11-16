-- 04a: users no longer edit users_profile directly (including email and plan).
-- The app saves profiles through the SECURITY DEFINER functions update_my_profile and save_workspace_profile,
-- which are not affected by this change.
revoke update on public.users_profile from authenticated;

-- 04b: the report views must respect row-level security, so a normal user sees only their own rows.
-- Run 99_verify.sql query 1 first. If a view already shows security_invoker=true, skip it.
alter view public.invoice_reports_view set (security_invoker = true);
alter view public.survey_reports_view set (security_invoker = true);

-- After this, admins still see everything because the underlying tables have admin (is_admin()) policies.
-- Test the Admin Invoice Reports and Survey Reports pages straight away.

-- Rollback:
-- grant update on public.users_profile to authenticated;
-- alter view public.invoice_reports_view set (security_invoker = false);
-- alter view public.survey_reports_view set (security_invoker = false);
