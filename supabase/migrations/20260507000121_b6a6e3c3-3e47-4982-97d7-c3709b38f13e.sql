
CREATE OR REPLACE FUNCTION public.admin_get_cron_jobs()
RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean, command text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  RETURN QUERY
  SELECT j.jobid, j.jobname::text, j.schedule::text, j.active, j.command::text
  FROM cron.job j;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_cron_runs(p_limit integer DEFAULT 100)
RETURNS TABLE(jobid bigint, jobname text, status text, return_message text, start_time timestamptz, end_time timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  RETURN QUERY
  SELECT r.jobid, j.jobname::text, r.status::text, r.return_message::text, r.start_time, r.end_time
  FROM cron.job_run_details r
  LEFT JOIN cron.job j ON j.jobid = r.jobid
  ORDER BY r.start_time DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_cron_runs(integer) TO authenticated;
