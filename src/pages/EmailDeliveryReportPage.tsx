import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2, X, Download, FileSpreadsheet } from 'lucide-react';
import { downloadCsv, downloadExcel } from '@/lib/exportUtils';
import TablePagination from '@/components/TablePagination';

interface Row {
  id: string;
  invoice_code: string | null;
  client_name: string | null;
  client_company: string | null;
  total_amount: number | null;
  due_date: string | null;
  status: string | null;
  before_3_sent: boolean | null;
  due_sent: boolean | null;
  after_3_sent: boolean | null;
  after_7_sent: boolean | null;
  after_14_sent: boolean | null;
  user_id: string;
  owner_email?: string | null;
  owner_name?: string | null;
}

const Tick = ({ v }: { v: boolean | null }) =>
  v ? <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;

const statusBadge = (s: string | null) => {
  const map: Record<string, { variant: any; label: string }> = {
    paid: { variant: 'default', label: 'Paid' },
    pending: { variant: 'secondary', label: 'Pending' },
    due_soon: { variant: 'outline', label: 'Due Soon' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };
  const m = map[s ?? ''] || map.pending;
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

interface Props { adminMode?: boolean }

export default function EmailDeliveryReportPage({ adminMode = false }: Props) {
  const { user, isAdmin } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sentFilter, setSentFilter] = useState(''); // any/none/before_3/due/after_3/after_7/after_14
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);


  useEffect(() => {
    const load = async () => {
      let q = supabase
        .from('invoices')
        .select('id,invoice_code,client_name,client_company,total_amount,due_date,status,before_3_sent,due_sent,after_3_sent,after_7_sent,after_14_sent,user_id')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!adminMode && user) q = q.eq('user_id', user.id);
      const { data } = await q;
      let result = (data ?? []) as Row[];
      if (adminMode && result.length) {
        const ids = Array.from(new Set(result.map(r => r.user_id)));
        const { data: profs } = await supabase.from('users_profile').select('id,email,full_name').in('id', ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        result = result.map(r => ({ ...r, owner_email: map.get(r.user_id)?.email, owner_name: map.get(r.user_id)?.full_name }));
      }
      setRows(result);
    };
    load();
  }, [adminMode, user?.id]);

  const filtered = useMemo(() => rows.filter(r => {
    if (search) {
      const s = search.toLowerCase();
      const hay = `${r.invoice_code ?? ''} ${r.client_name ?? ''} ${r.client_company ?? ''} ${r.owner_email ?? ''} ${r.owner_name ?? ''}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (statusFilter && r.status !== statusFilter) return false;
    if (sentFilter) {
      const flags: Record<string, boolean | null> = {
        before_3: r.before_3_sent, due: r.due_sent, after_3: r.after_3_sent, after_7: r.after_7_sent, after_14: r.after_14_sent,
      };
      if (sentFilter === 'any') {
        if (!Object.values(flags).some(Boolean)) return false;
      } else if (sentFilter === 'none') {
        if (Object.values(flags).some(Boolean)) return false;
      } else {
        if (!flags[sentFilter]) return false;
      }
    }
    return true;
  }), [rows, search, statusFilter, sentFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, sentFilter]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);


  const exportData = useMemo(() => filtered.map(r => ({
    'Client Name': r.client_name ?? '',
    'Client Company': r.client_company ?? '',
    'Invoice No': r.invoice_code ?? '',
    'Invoice Amount': r.total_amount ?? 0,
    'Due Date': r.due_date ?? '',
    '-3 Days Mail': r.before_3_sent ? 'Sent' : 'Not Sent',
    'Due Date Mail': r.due_sent ? 'Sent' : 'Not Sent',
    '+3 Days Mail': r.after_3_sent ? 'Sent' : 'Not Sent',
    '+7 Days Mail': r.after_7_sent ? 'Sent' : 'Not Sent',
    '+14 Days Mail': r.after_14_sent ? 'Sent' : 'Not Sent',
    'Invoice Status': r.status ?? '',
    ...(adminMode ? { 'Owner': r.owner_name ?? r.owner_email ?? '' } : {}),
  })), [filtered, adminMode]);

  if (adminMode && !isAdmin) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Admin access required.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Email Delivery Report</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv(exportData, 'email-delivery-report')} disabled={!filtered.length}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExcel(exportData, 'email-delivery-report')} disabled={!filtered.length}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">{adminMode ? 'Reminder email delivery status across all users' : 'Reminder email delivery status for your invoices'}</p>

        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search client, company, invoice no..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sentFilter} onChange={e => setSentFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All Reminders</option>
              <option value="any">Any Reminder Sent</option>
              <option value="none">No Reminder Sent</option>
              <option value="before_3">-3 Days Sent</option>
              <option value="due">Due Date Sent</option>
              <option value="after_3">+3 Days Sent</option>
              <option value="after_7">+7 Days Sent</option>
              <option value="after_14">+14 Days Sent</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Client Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client Company</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice No</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">-3d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Due</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+3d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+7d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+14d</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  {adminMode && <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-foreground">{r.client_name}</td>
                    <td className="p-3 text-muted-foreground">{r.client_company || '—'}</td>
                    <td className="p-3 font-medium text-foreground">{r.invoice_code || '—'}</td>
                    <td className="p-3 text-right text-foreground">{(r.total_amount ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{r.due_date}</td>
                    <td className="p-3"><Tick v={r.before_3_sent} /></td>
                    <td className="p-3"><Tick v={r.due_sent} /></td>
                    <td className="p-3"><Tick v={r.after_3_sent} /></td>
                    <td className="p-3"><Tick v={r.after_7_sent} /></td>
                    <td className="p-3"><Tick v={r.after_14_sent} /></td>
                    <td className="p-3">{statusBadge(r.status)}</td>
                    {adminMode && <td className="p-3 text-muted-foreground text-xs">{r.owner_name || r.owner_email || '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <div className="p-12 text-center text-muted-foreground">No invoices found.</div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
