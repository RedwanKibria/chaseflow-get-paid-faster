ALTER TABLE public.user_page_permissions ALTER COLUMN pro_plan SET DEFAULT false;
UPDATE public.user_page_permissions SET pro_plan = false;