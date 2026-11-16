import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Search, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadCsv, downloadExcel } from '@/lib/exportUtils';
import { fetchAllRows, chunk } from '@/lib/fetchAll';
import { toast } from 'sonner';
import TablePagination from '@/components/TablePagination';

interface LogRow {
  id: string;
  log_code: string | null;
  actor_user_id: string | null;
  related_user_id: string | null;
  invoice_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

export default function AdminSystemLogsPage() {
  const { isAdmin, invoices } = useApp();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [userEmailMap, setUserEmailMap] = useState<Map<string, string>>(new Map());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const invoiceMap = useMemo(() => new Map(invoices.map(i => [i.id, i.invoice_code])), [invoices]);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch logs
    fetchAllRows<LogRow>((from, to) =>
      supabase
        .from('activity_logs')
        .select('id, log_code, actor_user_id, related_user_id, invoice_id, action_type, description, created_at')
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, to) as any,
    )
      .then(async (rows) => {
        setLogs(rows);

        // Collect unique user IDs for actor and related
        const userIds = new Set<string>();
        rows.forEach(l => {
          if (l.actor_user_id) userIds.add(l.actor_user_id);
          if (l.related_user_id) userIds.add(l.related_user_id);
        });

        if (userIds.size > 0) {
          const map = new Map<string, string>();
          for (const part of chunk(Array.from(userIds), 100)) {
            const { data: profiles } = await supabase.from('users_profile').select('id, email').in('id', part);
            (profiles ?? []).forEach((p: any) => {
              if (p.email) map.set(p.id, p.email);
            });
          }
          setUserEmailMap(map);
        }
      })
      .catch(() => toast.error('Could not load all system logs. Please refresh.'));
  }, [isAdmin]);

  const actionTypes = useMemo(() => [...new Set(logs.map(l => l.action_type))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (search && !log.description.toLowerCase().includes(search.toLowerCase()) && !(log.log_code ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAction && log.action_type !== filterAction) return false;
      const d = log.created_at.split('T')[0];
      if (filterDateFrom && d < filterDateFrom) return false;
      if (filterDateTo && d > filterDateTo) return false;
      return true;
    });
  }, [logs, search, filterAction, filterDateFrom, filterDateTo]);

  useEffect(() => { setPage(1); }, [search, filterAction, filterDateFrom, filterDateTo]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);


  const exportData = useMemo(() => filtered.map(log => ({
    'Log ID': log.log_code ?? '',
    'Actor': log.actor_user_id ? (userEmailMap.get(log.actor_user_id) ?? log.actor_user_id) : '',
    'Related User': log.related_user_id ? (userEmailMap.get(log.related_user_id) ?? log.related_user_id) : '',
    'Action': log.action_type,
    'Description': log.description,
    'Invoice': log.invoice_id ? (invoiceMap.get(log.invoice_id) ?? '') : '',
    'Timestamp': log.created_at,
  })), [filtered, userEmailMap, invoiceMap]);

  if (!isAdmin) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Admin access required.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv(exportData, 'system-logs')} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExcel(exportData, 'system-logs')} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel (.xls)
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">All system and user activity logs</p>

        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="">All Actions</option>
              {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Log ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actor</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Related User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground font-mono text-xs">{log.log_code || '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{log.actor_user_id ? (userEmailMap.get(log.actor_user_id) || log.actor_user_id.slice(0, 8)) : '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{log.related_user_id ? (userEmailMap.get(log.related_user_id) || log.related_user_id.slice(0, 8)) : '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-foreground">{log.description}</td>
                    <td className="p-3 font-medium text-primary">{log.invoice_id ? (invoiceMap.get(log.invoice_id) || '—') : '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground">No logs found.</div>}
          {filtered.length > 0 && (
            <TablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
