-- 1) Dedupe: keep the row with the most restrictive perms (false < true) per (user_id, survey_question_id)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, survey_question_id
           ORDER BY (can_view::int + can_answer::int) ASC, created_at ASC
         ) AS rn
  FROM public.user_survey_question_permissions
)
DELETE FROM public.user_survey_question_permissions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2) Add unique constraint
ALTER TABLE public.user_survey_question_permissions
  ADD CONSTRAINT user_survey_question_permissions_user_question_unique
  UNIQUE (user_id, survey_question_id);

-- 3) Admin RPC to upsert a single perm safely
CREATE OR REPLACE FUNCTION public.admin_set_survey_question_permission(
  p_user_id uuid,
  p_survey_question_id uuid,
  p_can_view boolean,
  p_can_answer boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  INSERT INTO public.user_survey_question_permissions (user_id, survey_question_id, can_view, can_answer)
  VALUES (p_user_id, p_survey_question_id, p_can_view, p_can_answer)
  ON CONFLICT (user_id, survey_question_id)
  DO UPDATE SET can_view = EXCLUDED.can_view,
                can_answer = EXCLUDED.can_answer,
                updated_at = now();

  PERFORM public.add_activity_log(
    auth.uid(),
    'admin_set_survey_question_permission',
    'Updated survey question permission (view=' || p_can_view::text || ', answer=' || p_can_answer::text || ')',
    NULL,
    p_user_id
  );
END;
$$;