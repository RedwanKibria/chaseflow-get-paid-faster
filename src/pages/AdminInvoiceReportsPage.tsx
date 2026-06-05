import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2, X, Download, FileSpreadsheet } from 'lucide-react';
import { downloadCsv, downloadExcel } from '@/lib/exportUtils';
import TablePagination from '@/components/TablePagination';

interface ReportRow {
  id: string | null;
  invoice_code: string | null;
  invoice_type: string | null;
  client_name: string | null;
  client_company: string | null;
  your_company_name: string | null;
  due_date: string | null;
  subtotal_amount: number | null;
  vat_percent: number | null;
  tax_percent: number | null;
  vat_amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  status: string | null;
  paid: boolean | null;
  owner_full_name: string | null;
  owner_email: string | null;
  owner_role: string | null;
  owner_is_active: boolean | null;
  before_3_sent: boolean | null;
  due_sent: boolean | null;
  after_3_sent: boolean | null;
  after_7_sent: boolean | null;
  after_14_sent: boolean | null;
  created_at: string | null;
}

const SentIcon = ({ sent }: { sent: boolean | null }) =>
  sent ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground/40" />;

const statusBadge = (status: string | null) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    paid: { variant: 'default', label: 'Paid' },
    pending: { variant: 'secondary', label: 'Pending' },
    due_soon: { variant: 'outline', label: 'Due Soon' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };
  const s = map[status ?? ''] || map.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function AdminInvoiceReportsPage() {
  const { isAdmin } = useApp();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('invoice_reports_view')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => setRows((data ?? []) as ReportRow[]));
  }, [isAdmin]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const s = search.toLowerCase();
        if (!(r.client_name ?? '').toLowerCase().includes(s) && !(r.invoice_code ?? '').toLowerCase().includes(s) && !(r.owner_full_name ?? '').toLowerCase().includes(s)) return false;
      }
      if (filterStatus && r.status !== filterStatus) return false;
      return true;
    });
  }, [rows, search, filterStatus]);

  useEffect(() => { setPage(1); }, [search, filterStatus]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);


  const exportData = useMemo(() => {
    return filtered.map(r => ({
      'Invoice Code': r.invoice_code ?? '',
      'Type': r.invoice_type ?? '',
      'Client': r.client_name ?? '',
      'Company': r.client_company ?? '',
      'Your Company': r.your_company_name ?? '',
      'Due Date': r.due_date ?? '',
      'Subtotal': r.subtotal_amount ?? 0,
      'VAT %': r.vat_percent ?? 0,
      'VAT Amount': r.vat_amount ?? 0,
      'TAX %': r.tax_percent ?? 0,
      'TAX Amount': r.tax_amount ?? 0,
      'Total': r.total_amount ?? 0,
      'Status': r.status ?? '',
      'Paid': r.paid ? 'Yes' : 'No',
      'Owner': r.owner_full_name ?? '',
      'Owner Email': r.owner_email ?? '',
      'Owner Role': r.owner_role ?? '',
      'Owner Active': r.owner_is_active ? 'Yes' : 'No',
      'Before 3d Sent': r.before_3_sent ? 'Yes' : 'No',
      'Due Sent': r.due_sent ? 'Yes' : 'No',
      'After 3d Sent': r.after_3_sent ? 'Yes' : 'No',
      'After 7d Sent': r.after_7_sent ? 'Yes' : 'No',
      'After 14d Sent': r.after_14_sent ? 'Yes' : 'No',
      'Created': r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
    }));
  }, [filtered]);

  if (!isAdmin) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Admin access required.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Invoice Reports</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv(exportData, 'invoice-report')} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExcel(exportData, 'invoice-report')} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">Comprehensive invoice overview across all users</p>

        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by client, invoice code, or owner..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Subtotal</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">VAT</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">TAX</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">-3d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Due</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+3d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+7d</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">+14d</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{r.invoice_code || '—'}</td>
                    <td className="p-3 text-muted-foreground capitalize">{r.invoice_type}</td>
                    <td className="p-3 text-foreground">{r.client_name}</td>
                    <td className="p-3 text-muted-foreground">{r.client_company || '—'}</td>
                    <td className="p-3 text-muted-foreground">{r.due_date}</td>
                    <td className="p-3 text-right text-foreground">{(r.subtotal_amount ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-muted-foreground">{r.vat_percent ? `${r.vat_percent}%` : '—'}</td>
                    <td className="p-3 text-right text-muted-foreground">{r.tax_percent ? `${r.tax_percent}%` : '—'}</td>
                    <td className="p-3 text-right font-medium text-foreground">{(r.total_amount ?? 0).toLocaleString()}</td>
                    <td className="p-3">{statusBadge(r.status)}</td>
                    <td className="p-3 text-muted-foreground text-xs">{r.owner_full_name || r.owner_email || '—'}</td>
                    <td className="p-3 text-center"><SentIcon sent={r.before_3_sent} /></td>
                    <td className="p-3 text-center"><SentIcon sent={r.due_sent} /></td>
                    <td className="p-3 text-center"><SentIcon sent={r.after_3_sent} /></td>
                    <td className="p-3 text-center"><SentIcon sent={r.after_7_sent} /></td>
                    <td className="p-3 text-center"><SentIcon sent={r.after_14_sent} /></td>
                    <td className="p-3 text-muted-foreground text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground">No reports found.</div>}
          {filtered.length > 0 && (
            <TablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
