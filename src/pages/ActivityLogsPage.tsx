import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ActivityLogsPage() {
  const { activityLogs, invoices } = useApp();
  const invoiceMap = useMemo(() => new Map(invoices.map(i => [i.id, i.invoice_number])), [invoices]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const actionTypes = useMemo(() => [...new Set(activityLogs.map(l => l.action_type))], [activityLogs]);

  const filtered = useMemo(() => {
    return activityLogs.filter(log => {
      if (search && !log.description.toLowerCase().includes(search.toLowerCase()) && !log.invoice_id?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAction && log.action_type !== filterAction) return false;
      const logDate = log.created_at.split('T')[0];
      if (filterDateFrom && logDate < filterDateFrom) return false;
      if (filterDateTo && logDate > filterDateTo) return false;
      return true;
    });
  }, [activityLogs, search, filterAction, filterDateFrom, filterDateTo]);

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Activity Logs</h1>
        <p className="text-muted-foreground mb-8">Complete audit trail of all actions</p>

        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
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
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-muted-foreground font-mono text-xs">{log.log_number}</td>
                    <td className="p-3 text-foreground">{log.user_id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-foreground">{log.description}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-medium text-primary">{log.invoice_id ? (invoiceMap.get(log.invoice_id) || log.invoice_id) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No activity logs found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
