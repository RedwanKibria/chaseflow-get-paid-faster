CREATE OR REPLACE FUNCTION public.create_reminder_jobs_for_invoice(p_invoice_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_due_date date;
  v_before_3 boolean;
  v_due boolean;
  v_after_3 boolean;
  v_after_7 boolean;
  v_after_14 boolean;
  v_now timestamp;
  v_scheduled timestamp;
begin
  select
    due_date, reminder_before_3, reminder_due,
    reminder_after_3, reminder_after_7, reminder_after_14
  into
    v_due_date, v_before_3, v_due,
    v_after_3, v_after_7, v_after_14
  from public.invoices
  where id = p_invoice_id;

  v_now := now();

  delete from public.reminder_jobs
  where invoice_id = p_invoice_id and status = 'pending';

  if v_before_3 then
    v_scheduled := v_due_date::timestamp - interval '3 days';
    if v_scheduled >= v_now then
      insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
      values (p_invoice_id, 'before_3', v_scheduled, 'pending');
    end if;
  end if;

  if v_due then
    v_scheduled := v_due_date::timestamp;
    if v_scheduled >= v_now then
      insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
      values (p_invoice_id, 'due', v_scheduled, 'pending');
    end if;
  end if;

  if v_after_3 then
    v_scheduled := v_due_date::timestamp + interval '3 days';
    if v_scheduled >= v_now then
      insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
      values (p_invoice_id, 'after_3', v_scheduled, 'pending');
    end if;
  end if;

  if v_after_7 then
    v_scheduled := v_due_date::timestamp + interval '7 days';
    if v_scheduled >= v_now then
      insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
      values (p_invoice_id, 'after_7', v_scheduled, 'pending');
    end if;
  end if;

  if v_after_14 then
    v_scheduled := v_due_date::timestamp + interval '14 days';
    if v_scheduled >= v_now then
      insert into public.reminder_jobs (invoice_id, reminder_type, scheduled_for, status)
      values (p_invoice_id, 'after_14', v_scheduled, 'pending');
    end if;
  end if;
end;
$function$;