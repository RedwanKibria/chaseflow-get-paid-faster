import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Calendar, CheckCircle2, XCircle, Clock, Activity, Search } from 'lucide-react';
import { downloadCsv } from '@/lib/exportUtils';
import { useApp } from '@/context/AppContext';
import { Navigate } from 'react-router-dom';
import TablePagination from '@/components/TablePagination';
import { SkeletonRow } from '@/components/Spinner';

type CronJob = { jobid: number; jobname: string; schedule: string; active: boolean; command: string };
type CronRun = { jobid: number; jobname: string; status: string; return_message: string; start_time: string; end_time: string };

function describeSchedule(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  const everyDay = dom === '*' && mon === '*' && dow === '*';
  if (min === '*' && hour === '*') return 'Every minute';
  if (everyDay && hour === '*' && /^\d+$/.test(min)) {
    return `Every hour at :${min.padStart(2, '0')} UTC`;
  }
  if (everyDay && /^\*\/(\d+)$/.test(hour) && /^\d+$/.test(min)) {
    const n = hour.split('/')[1];
    return `Every ${n} hours at :${min.padStart(2, '0')} UTC`;
  }
  if (everyDay && /^\d+$/.test(min) && /^\d+$/.test(hour)) {
    return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  }
  return expr;
}

function nextRunFromCron(expr: string): Date | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, mon, dow] = parts;
  if (dom !== '*' || mon !== '*' || dow !== '*') return null;
  const m = parseInt(min, 10);
  if (isNaN(m)) return null;
  const now = new Date();

  // Hourly: minute fixed, hour = '*'
  if (hour === '*') {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), m, 0));
    if (next.getTime() <= now.getTime()) next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }
  const h = parseInt(hour, 10);
  if (isNaN(h)) return null;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function relativeTime(d: Date): string {
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const sec = Math.round(abs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const fmt = (n: number, u: string) => `${n} ${u}${n === 1 ? '' : 's'}`;
  const txt = sec < 60 ? fmt(sec, 'second') : min < 60 ? fmt(min, 'minute') : hr < 24 ? fmt(hr, 'hour') : fmt(day, 'day');
  return diff >= 0 ? `in ${txt}` : `${txt} ago`;
}

export default function AdminSchedulerReportPage() {
  const { isAdmin } = useApp();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed'>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    const [{ data: j }, { data: r }] = await Promise.all([
      supabase.rpc('admin_get_cron_jobs'),
      supabase.rpc('admin_get_cron_runs', { p_limit: 200 }),
    ]);
    setJobs((j as CronJob[]) ?? []);
    setRuns((r as CronRun[]) ?? []);
    setLastLoaded(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [statusFilter, jobFilter, search]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filteredRuns = useMemo(() => {
    const q = search.toLowerCase().trim();
    return runs.filter(r => {
      if (statusFilter === 'succeeded' && r.status !== 'succeeded') return false;
      if (statusFilter === 'failed' && r.status === 'succeeded') return false;
      if (jobFilter !== 'all' && (r.jobname || `Job ${r.jobid}`) !== jobFilter) return false;
      if (q && !`${r.jobname} ${r.status} ${r.return_message ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [runs, statusFilter, jobFilter, search]);

  const pagedRuns = useMemo(() => filteredRuns.slice((page - 1) * pageSize, page * pageSize), [filteredRuns, page, pageSize]);

  const successCount = runs.filter(r => r.status === 'succeeded').length;
  const failureCount = runs.filter(r => r.status !== 'succeeded').length;
  const successRate = runs.length ? Math.round((successCount / runs.length) * 100) : 0;
  const lastRun = runs[0] ? new Date(runs[0].start_time) : null;
  const avgDuration = (() => {
    const done = runs.filter(r => r.end_time);
    if (!done.length) return null;
    const sum = done.reduce((acc, r) => acc + (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()), 0);
    return Math.round(sum / done.length);
  })();

  const exportCsv = () => {
    const rows = filteredRuns.map(r => ({
      'Job Name': r.jobname || `Job ${r.jobid}`,
      'Status': r.status,
      'Start (UTC)': new Date(r.start_time).toISOString(),
      'End (UTC)': r.end_time ? new Date(r.end_time).toISOString() : '',
      'Duration (ms)': r.end_time ? new Date(r.end_time).getTime() - new Date(r.start_time).getTime() : '',
      'Message': (r.return_message || '').replace(/\s+/g, ' ').trim(),
    }));
    downloadCsv(rows, `scheduler-report-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Scheduler Report</h1>
            <p className="text-muted-foreground text-sm">Live status of the system cron jobs powering automated reminder emails.</p>
            {lastLoaded && (
              <p className="text-xs text-muted-foreground mt-1">Last refreshed {relativeTime(lastLoaded)}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading || refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={exportCsv} disabled={filteredRuns.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Jobs */}
        <div className="grid md:grid-cols-2 gap-4">
          {loading && jobs.length === 0 && (
            <>
              <div className="bg-card rounded-xl p-6 shadow-card h-32 animate-pulse" />
              <div className="bg-card rounded-xl p-6 shadow-card h-32 animate-pulse" />
            </>
          )}
          {jobs.map(job => {
            const nextRun = nextRunFromCron(job.schedule);
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
                      <span>Next run {relativeTime(nextRun)} <span className="text-muted-foreground text-xs">({nextRun.toUTCString()})</span></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Total Runs</p>
            <p className="text-2xl font-bold text-foreground">{runs.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Success Rate</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> {successRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{successCount} ok · {failureCount} failed</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Avg Duration</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> {avgDuration !== null ? `${avgDuration} ms` : '—'}
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="text-xs text-muted-foreground uppercase">Last Run</p>
            <p className="text-base font-semibold text-foreground mt-1">{lastRun ? relativeTime(lastRun) : '—'}</p>
            {lastRun && <p className="text-xs text-muted-foreground mt-0.5">{lastRun.toUTCString()}</p>}
          </div>
        </div>

        {/* Runs */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <h3 className="font-semibold text-foreground">Recent Runs</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search message…" className="h-8 pl-8 w-48 text-sm" />
              </div>
              <select
                value={jobFilter}
                onChange={e => setJobFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">All jobs</option>
                {jobs.map(j => <option key={j.jobid} value={j.jobname}>{j.jobname}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
              </select>
              <span className="text-xs text-muted-foreground ml-1">{filteredRuns.length} of {runs.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 md:px-6 py-3">Job</th>
                  <th className="px-4 md:px-6 py-3">Status</th>
                  <th className="px-4 md:px-6 py-3">Start (UTC)</th>
                  <th className="px-4 md:px-6 py-3">Duration</th>
                  <th className="px-4 md:px-6 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
                {!loading && filteredRuns.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No scheduler runs match the current filters.</td></tr>
                )}
                {!loading && pagedRuns.map((r, i) => {
                  const dur = r.end_time ? new Date(r.end_time).getTime() - new Date(r.start_time).getTime() : null;
                  const start = new Date(r.start_time);
                  return (
                    <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-foreground">{r.jobname || `Job ${r.jobid}`}</td>
                      <td className="px-4 md:px-6 py-3">
                        <Badge variant={r.status === 'succeeded' ? 'default' : 'destructive'} className="capitalize">{r.status}</Badge>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-muted-foreground whitespace-nowrap">
                        <div>{start.toUTCString()}</div>
                        <div className="text-xs">{relativeTime(start)}</div>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-muted-foreground whitespace-nowrap">{dur !== null ? `${dur} ms` : '—'}</td>
                      <td className="px-4 md:px-6 py-3 text-muted-foreground max-w-md truncate" title={r.return_message || ''}>{r.return_message || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRuns.length > 0 && (
            <TablePagination page={page} pageSize={pageSize} total={filteredRuns.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
