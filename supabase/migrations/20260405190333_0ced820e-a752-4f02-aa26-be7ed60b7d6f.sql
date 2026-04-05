
-- Add invoice_number to invoices
ALTER TABLE public.invoices ADD COLUMN invoice_number text UNIQUE;

-- Add log_number to activity_logs
ALTER TABLE public.activity_logs ADD COLUMN log_number text UNIQUE;

-- Create sequence for invoice numbers
CREATE SEQUENCE public.invoice_number_seq START 1;

-- Create sequence for log numbers
CREATE SEQUENCE public.log_number_seq START 1;

-- Function to auto-generate invoice_number on insert
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Function to auto-generate log_number on insert
CREATE OR REPLACE FUNCTION public.generate_log_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.log_number IS NULL THEN
    NEW.log_number := 'LOG-' || LPAD(nextval('public.log_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

CREATE TRIGGER trg_log_number
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_log_number();
