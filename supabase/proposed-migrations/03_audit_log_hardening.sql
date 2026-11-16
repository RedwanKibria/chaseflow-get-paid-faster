-- 03: nobody can write audit entries as another user.

create or replace function public.add_activity_log(p_actor_user_id uuid, p_action_type text, p_description text, p_invoice_id uuid default null::uuid, p_related_user_id uuid default null::uuid, p_meta jsonb default '{}'::jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  -- The service role (edge functions) may log for any user. Everyone else only for themselves.
  if coalesce(auth.role(), '') <> 'service_role' and p_actor_user_id is distinct from auth.uid() then
    raise exception 'Not allowed';
  end if;
  insert into public.activity_logs (user_id, actor_user_id, related_user_id, invoice_id, action_type, description, meta)
  values (p_actor_user_id, p_actor_user_id, p_related_user_id, p_invoice_id, p_action_type, p_description, coalesce(p_meta, '{}'::jsonb));
end;
$function$;

revoke execute on function public.add_activity_log(uuid, text, text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.add_activity_log(uuid, text, text, uuid, uuid, jsonb) to authenticated, service_role;

-- Direct inserts: a user may only add rows about themselves (admins may add any).
drop policy if exists activity_logs_insert_policy on public.activity_logs;
create policy activity_logs_insert_policy on public.activity_logs
  for insert to authenticated
  with check (
    public.is_admin()
    or (actor_user_id = auth.uid() and user_id = auth.uid() and (related_user_id is null or related_user_id = auth.uid()))
  );

-- Rollback: restore the function from supabase/migrations/20260408005724_*.sql and recreate the policy as
--   with check (is_admin() or actor_user_id = auth.uid())
