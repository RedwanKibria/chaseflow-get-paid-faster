-- Read-only checks. Run before and after, and compare.

-- 1. Report views: security_invoker should be true after file 04.
select c.relname, c.reloptions,
       has_table_privilege('anon', c.oid, 'select') as anon_can_select,
       has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('invoice_reports_view', 'survey_reports_view');

-- 2. Remaining policies on the tables changed above (the *_own versions should be gone).
select tablename, policyname, cmd, permissive from pg_policies
where schemaname = 'public' and tablename in ('activity_logs','invoices','invoice_items','reminder_jobs','subscriptions')
order by tablename, policyname;

-- 3. Who may run each function.
select p.proname, p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname;

-- 4. Buckets should not be public.
select id, public, file_size_limit, allowed_mime_types from storage.buckets;

-- 5. Branding columns exist.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'users_profile' and column_name in ('logo_path', 'branding_onboarded');
