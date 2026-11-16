-- 02: reminder jobs are created only by the database function, never directly by users.
-- Read README.md step 3 first.

create or replace function public.create_reminder_jobs_for_invoice(p_invoice_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_due_date date;
  v_before_3 boolean; v_due boolean; v_after_3 boolean; v_after_7 boolean; v_after_14 boolean;
  v_now timestamp;
  v_scheduled timestamp;
  v_offsets constant text[] := array['before_3','due','after_3','after_7','after_14'];
  v_days constant int[] := array[-3, 0, 3, 7, 14];
  v_flags boolean[];
  i int;
begin
  select user_id, due_date, reminder_before_3, reminder_due, reminder_after_3, reminder_after_7, reminder_after_14
    into v_owner, v_due_date, v_before_3, v_due, v_after_3, v_after_7, v_after_14
  from public.invoices where id = p_invoice_id;

  if v_owner is null then
    raise exception 'Invoice not found';
  end if;
  -- The service role (no auth.uid) and admins may run this for anyone; users only for their own invoice.
  if auth.uid() is not null and v_owner <> auth.uid() and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  v_flags := array[coalesce(v_before_3,false), coalesce(v_due,false), coalesce(v_after_3,false), coalesce(v_after_7,false), coalesce(v_after_14,false)];
  v_now := now();

  delete from public.reminder_jobs where invoice_id = p_invoice_id and status = 'pending';

  for i in 1..5 loop
    if v_flags[i] then
      v_scheduled := v_due_date::timestamp + make_interval(days => v_days[i]);
      -- A reminder whose day is today but whose midnight has passed is sent at the next run,
      -- instead of being skipped (for example the "due" reminder of an invoice created on its due date).
      if v_scheduled < v_now and v_scheduled::date = v_now::date then
        v_scheduled := v_now;
      end if;
      if v_scheduled >= v_now then
        insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
        values (p_invoice_id, v_offsets[i], v_scheduled, 'pending');
      end if;
    end if;
  end loop;
end;
$function$;

revoke all on function public.create_reminder_jobs_for_invoice(uuid) from public, anon;
grant execute on function public.create_reminder_jobs_for_invoice(uuid) to authenticated, service_role;

-- Users no longer write reminder_jobs directly; they can still read their own through the select policy.
drop policy if exists reminder_jobs_insert_own on public.reminder_jobs;
drop policy if exists reminder_jobs_insert_policy on public.reminder_jobs;
drop policy if exists reminder_jobs_update_own on public.reminder_jobs;
drop policy if exists reminder_jobs_update_policy on public.reminder_jobs;
drop policy if exists reminder_jobs_delete_own on public.reminder_jobs;
drop policy if exists reminder_jobs_select_own on public.reminder_jobs;

-- Rollback: recreate the policies from your export (reminder_jobs_*_own / *_policy) and restore the
-- previous function body from supabase/migrations/20260508113836_*.sql.
