import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { FileText, AlertTriangle, Clock, DollarSign, Check, Download, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { downloadInvoicePdf } from '@/lib/invoiceStorage';
import { getCurrencySymbol } from '@/lib/currency';

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    paid: { variant: 'default', label: 'Paid' },
    pending: { variant: 'secondary', label: 'Pending' },
    due_soon: { variant: 'outline', label: 'Due Soon' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function DashboardPage() {
  const { invoices, markAsPaid, cancelInvoice, softDeleteInvoice, addLog, user } = useApp();
  const activeInvoices = useMemo(() => invoices.filter(i => !i.is_deleted), [invoices]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const currency = user?.currency || 'GBP';
  const currencySymbol = getCurrencySymbol(currency);

  const stats = useMemo(() => {
    const total = activeInvoices.length;
    const overdue = activeInvoices.filter(i => i.status === 'overdue').length;
    const dueSoon = activeInvoices.filter(i => i.status === 'due_soon').length;
    const outstanding = activeInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.total_amount, 0);
    return { total, overdue, dueSoon, outstanding };
  }, [activeInvoices]);

  const kpis = [
    { label: 'Total Invoices', value: stats.total, icon: FileText, color: 'text-primary' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Due Soon', value: stats.dueSoon, icon: Clock, color: 'text-warning' },
    { label: 'Outstanding', value: `${currencySymbol}${stats.outstanding.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
  ];

  const handleDownload = async (inv: typeof activeInvoices[number]) => {
    await downloadInvoicePdf(inv, currencySymbol);
    addLog({ invoice_id: inv.id, action_type: 'invoice_downloaded', description: `Invoice ${inv.invoice_code} downloaded` });
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await softDeleteInvoice(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Overview of your invoicing activity</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {kpis.map(k => (
            <div key={k.label} className="bg-card rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeInvoices.slice(0, 10).map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{inv.invoice_code}</td>
                    <td className="p-3 text-foreground">{inv.client_name}</td>
                    <td className="p-3 text-muted-foreground">{inv.client_company}</td>
                    <td className="p-3 text-right font-medium text-foreground">{currencySymbol}{inv.total_amount.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="p-3">{statusBadge(inv.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!inv.paid && inv.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(inv.id)} className="h-8 text-xs">
                            <Check className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" onClick={() => cancelInvoice(inv.id)} className="h-8 text-xs text-destructive">
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(inv)} className="h-8 text-xs">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(inv.id)} className="h-8 text-xs text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this invoice? This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
