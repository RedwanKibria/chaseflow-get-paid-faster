# ChaseFlow

Automated invoicing and payment reminders for freelancers, consultants and small businesses. Create Regular or Hourly invoices, email the PDF, and let ChaseFlow send up to five scheduled reminders (3 days before due, on the due date, and 3, 7 and 14 days after).

Status: free early-access build. No payments or paid plans.

## Features
- Accounts with optional branding (company name and logo, skippable at first login, editable in Settings)
- Regular (quantity x price) and Hourly (hours x rate) invoices with VAT and tax, live preview and PDF
- Send Invoice Now, or Send Reminderwise (reminders only)
- Dashboard, My Invoices with filters and bulk actions, Email Delivery report, Activity Logs, feedback survey
- Admin: user management and page permissions, system logs, invoice reports, scheduler report, survey reports
- CSV and spreadsheet exports, Download my data (JSON), Request account deletion, password reset, Terms and Privacy pages

## Tech stack
React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query. Backend on Supabase (Postgres, Auth, Storage, Edge Functions). Email through Resend. PDFs generated in the browser with jsPDF.

## Getting started
```bash
npm install
npm run dev      # start locally
npm run build    # production build
npm test         # Vitest
```

Create a `.env` file with your own project values (do not commit it):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```
Edge function secrets are set in Supabase, never in the front end: `RESEND_API_KEY`, `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Project layout
- `src/pages` application screens; `src/context/AppContext.tsx` data and session state
- `src/lib` PDF generation, branding, exports, currency
- `supabase/functions` edge functions: `send-invoice-now`, `process-reminders`, `send-welcome-email`, `request-account-deletion`
- `supabase/migrations` and `drizzle/migrations` database changes (branding migration currently lives in `drizzle/`)

## Known limitations
- Account deletion deactivates the account and cancels reminders; rows are not erased automatically
- `supabase/proposed-migrations` holds database security fixes that must be run manually (see its README)
- Legal placeholders in `src/config/legal.ts` must be filled and reviewed before launch
- Row-level security policies and the cron schedule are managed in Supabase and are not in this repository
- No bounce or complaint handling yet

See the Technical Document and BRD for the full list of findings and requirements.
