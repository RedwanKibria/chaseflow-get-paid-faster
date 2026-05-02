CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_is_admin boolean;
begin
  v_is_admin := lower(coalesce(new.email, '')) = 'rizon_73@yahoo.com';

  insert into public.users_profile (id, full_name, email, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'company_name', null)
  )
  on conflict (id) do nothing;

  insert into public.user_access (user_id, role, is_active)
  values (new.id, case when v_is_admin then 'admin' else 'user' end, true)
  on conflict (user_id) do update
    set role = excluded.role, is_active = excluded.is_active, updated_at = now();

  insert into public.user_page_permissions (
    user_id, dashboard, create_invoice, my_invoices, activity_logs,
    pro_plan, settings, review_feedback,
    admin_user_management, admin_system_logs, admin_invoice_reports, admin_survey_reports
  ) values (
    new.id, true, true, true, true,
    v_is_admin, true, true,
    v_is_admin, v_is_admin, v_is_admin, v_is_admin
  )
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$function$;