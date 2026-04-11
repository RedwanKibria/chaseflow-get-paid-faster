-- Fix: Add 'cancelled' to the invoices status check constraint
ALTER TABLE public.invoices DROP CONSTRAINT invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (status = ANY (ARRAY['pending'::text, 'due_soon'::text, 'overdue'::text, 'paid'::text, 'cancelled'::text]));

-- Add currency column to users_profile
ALTER TABLE public.users_profile ADD COLUMN currency text NOT NULL DEFAULT 'GBP';

-- Update the update_my_profile function to include currency
CREATE OR REPLACE FUNCTION public.update_my_profile(p_full_name text, p_company_name text, p_currency text DEFAULT 'GBP')
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.users_profile
  set
    full_name = p_full_name,
    company_name = p_company_name,
    currency = p_currency,
    updated_at = now()
  where id = auth.uid();
end;
$function$;