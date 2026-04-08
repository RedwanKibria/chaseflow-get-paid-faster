-- Fix the 5-param add_activity_log overload to include user_id (NOT NULL column)
CREATE OR REPLACE FUNCTION public.add_activity_log(p_actor_user_id uuid, p_action_type text, p_description text, p_invoice_id uuid DEFAULT NULL::uuid, p_related_user_id uuid DEFAULT NULL::uuid, p_meta jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.activity_logs (
    user_id,
    actor_user_id,
    related_user_id,
    invoice_id,
    action_type,
    description,
    meta
  )
  values (
    p_actor_user_id,
    p_actor_user_id,
    p_related_user_id,
    p_invoice_id,
    p_action_type,
    p_description,
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$function$;