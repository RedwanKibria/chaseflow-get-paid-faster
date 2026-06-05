import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';
import { useApp } from '@/context/AppContext';
import { Navigate } from 'react-router-dom';
import TablePagination from '@/components/TablePagination';

type CronJob = { jobid: number; jobname: string; schedule: string; active: boolean; command: string };
type CronRun = { jobid: number; jobname: string; status: string; return_message: string; start_time: string; end_time: string };

// Parse a 5-field cron expression into a human-readable string (covers common cases)
function describeSchedule(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  if (min === '*' && hour === '*') return 'Every minute';
  if (dom === '*' && mon === '*' && dow === '*') {
    const h = hour.padStart(2, '0');
    const m = min.padStart(2, '0');
    return `Daily at ${h}:${m} UTC (every 24 hours)`;
  }
  return expr;
}

function nextRunFromDaily(expr: string): Date | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, mon, dow] = parts;
  if (dom !== '*' || mon !== '*' || dow !== '*') return null;
  const m = parseInt(min, 10);
  const h = parseInt(hour, 10);
  if (isNaN(m) || isNaN(h)) return null;
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export default function AdminSchedulerReportPage() {
  const { isAdmin } = useApp();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const pagedRuns = useMemo(() => runs.slice((page - 1) * pageSize, page * pageSize), [runs, page, pageSize]);


  const load = async () => {
    setLoading(true);
    const [{ data: j }, { data: r }] = await Promise.all([
      supabase.rpc('admin_get_cron_jobs'),
      supabase.rpc('admin_get_cron_runs', { p_limit: 200 }),
    ]);
    setJobs((j as CronJob[]) ?? []);
    setRuns((r as CronRun[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const exportCsv = () => {
    const rows = runs.map(r => ({
      'Job Name': r.jobname || `Job ${r.jobid}`,
      'Status': r.status,
      'Start (UTC)': new Date(r.start_time).toISOString(),
      'End (UTC)': r.end_time ? new Date(r.end_time).toISOString() : '',
      'Duration (ms)': r.end_time ? new Date(r.end_time).getTime() - new Date(r.start_time).getTime() : '',
      'Message': (r.return_message || '').replace(/\s+/g, ' ').trim(),
    }));
    downloadCsv(rows, `scheduler-report-${new Date().toISOString().split('T')[0]}`);
  };

  const successCount = runs.filter(r => r.status === 'succeeded').length;
  const failureCount = runs.filter(r => r.status !== 'succeeded').length;

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Scheduler Report</h1>
            <p className="text-muted-foreground text-sm">Live status of the system cron jobs powering automated reminder emails.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={runs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Jobs */}
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map(job => {
            const nextRun = nextRunFromDaily(job.schedule);
            return (
              <div key={job.jobid} className="bg-card rounded-xl p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{job.jobname}</h3>
                  <Badge variant={job.active ? 'default' : 'secondary'}>{job.active ? 'Active' : 'Paused'}</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{describeSchedule(job.schedule)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cron expression: <code className="px-1.5 py-0.5 bg-muted rounded">{job.schedule}</code>
                  </div>
                  {nextRun && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Next run: {nextRun.toUTCString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Total Runs</p>
            <p className="text-2xl font-bold text-foreground">{runs.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Succeeded</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> {successCount}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Failed</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> {failureCount}
            </p>
          </div>
        </div>

        {/* Runs */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Runs</h3>
            <span className="text-xs text-muted-foreground">Showing latest {runs.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-3">Job</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Start (UTC)</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!loading && runs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No scheduler runs found.</td></tr>
                )}
                {pagedRuns.map((r, i) => {
                  const dur = r.end_time ? new Date(r.end_time).getTime() - new Date(r.start_time).getTime() : null;
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="px-6 py-3 text-foreground">{r.jobname || `Job ${r.jobid}`}</td>
                      <td className="px-6 py-3">
                        <Badge variant={r.status === 'succeeded' ? 'default' : 'destructive'}>{r.status}</Badge>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{new Date(r.start_time).toUTCString()}</td>
                      <td className="px-6 py-3 text-muted-foreground">{dur !== null ? `${dur} ms` : '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground max-w-md truncate" title={r.return_message || ''}>{r.return_message || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {runs.length > 0 && (
            <TablePagination page={page} pageSize={pageSize} total={runs.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
