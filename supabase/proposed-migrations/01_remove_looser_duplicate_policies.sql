-- 01: remove the older, looser policies. The stricter "*_policy" versions stay.
-- Verified against the app code: the browser never deletes rows, only updates invoices as the
-- owner, and writes activity_logs with user_id = actor_user_id = the signed-in user.

-- Audit log: users can add their own entries but not edit or delete any.
drop policy if exists activity_logs_update_own on public.activity_logs;
drop policy if exists activity_logs_delete_own on public.activity_logs;
drop policy if exists activity_logs_insert_own on public.activity_logs;

-- Invoices and items: enforce "active account" and "not deleted", no hard deletes by users.
drop policy if exists invoices_select_own on public.invoices;
drop policy if exists invoices_update_own on public.invoices;
drop policy if exists invoices_delete_own on public.invoices;
drop policy if exists invoice_items_select_own on public.invoice_items;
drop policy if exists invoice_items_insert_own on public.invoice_items;
drop policy if exists invoice_items_update_own on public.invoice_items;
drop policy if exists invoice_items_delete_own on public.invoice_items;

-- Subscriptions (deprecated): users may read their row only.
drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;
drop policy if exists subscriptions_delete_own on public.subscriptions;

-- Rollback (run to restore the old behaviour):
-- create policy activity_logs_update_own on public.activity_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy activity_logs_delete_own on public.activity_logs for delete to authenticated using (auth.uid() = user_id);
-- create policy activity_logs_insert_own on public.activity_logs for insert to authenticated with check (auth.uid() = user_id);
-- create policy invoices_select_own on public.invoices for select to authenticated using (auth.uid() = user_id);
-- create policy invoices_update_own on public.invoices for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy invoices_delete_own on public.invoices for delete to authenticated using (auth.uid() = user_id);
