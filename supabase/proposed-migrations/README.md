# Proposed database changes (not applied automatically)

These files are **not** in `supabase/migrations`, so they are not run by any tool. They are written from the policies you exported on 22 Oct 2026 and from the app code. Run them yourself in the Supabase SQL Editor, in order, **after taking a backup**, and test the app after each file.

| File | What it fixes | Risk if skipped |
|---|---|---|
| `01_remove_looser_duplicate_policies.sql` | Old `*_own` policies override the stricter `*_policy` ones. Users can currently edit or delete their own audit log, hard-delete invoices, and still read data when deactivated or soft-deleted | The new send limits can be reset by deleting log rows; "deactivate user" is not enforced in the database |
| `02_reminder_jobs_server_controlled.sql` | Users can create, edit or delete reminder jobs directly. Makes the reminder function run with owner rights and checks ownership. Also schedules a "due today" reminder for an invoice created on its due date | Extra emails can be queued; same-day "due" reminders are skipped |
| `03_audit_log_hardening.sql` | `add_activity_log` accepts any actor, so anyone could write audit entries as another user | Forged audit entries |
| `04_profile_and_report_views.sql` | Stops direct edits to `users_profile`; makes the two report views respect row-level security | Any logged-in user may be able to read every user's invoices through the report views (check with `99_verify.sql` first) |
| `99_verify.sql` | Read-only checks to run before and after | |

## Before you start
1. Back up (Supabase > Database > Backups) or export the schema.
2. Run `99_verify.sql` and keep the output.
3. For file 02, check how `mark_invoice_paid`, `cancel_invoice` and `soft_delete_invoice` are defined (`select pg_get_functiondef('public.cancel_invoice(uuid)'::regprocedure);`). If they update `reminder_jobs` as the calling user, make them `SECURITY DEFINER` first. The reminder processor already cancels jobs for paid, cancelled or deleted invoices, so reminders will not go out either way.

## After each file, test
Sign up and log in; create and send an invoice; mark it paid; soft-delete one; log in as admin and open Invoice Reports, Email Delivery (All), System Logs, Survey Reports and the Scheduler Report.

## Rolling back
Each file lists the statements to undo it at the bottom (commented out). Policies recreate cleanly from the exported definitions you pasted earlier.
