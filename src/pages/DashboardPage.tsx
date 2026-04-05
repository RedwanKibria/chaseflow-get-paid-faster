import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { FileText, AlertTriangle, Clock, DollarSign, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    paid: { variant: 'default', label: 'Paid' },
    pending: { variant: 'secondary', label: 'Pending' },
    due_soon: { variant: 'outline', label: 'Due Soon' },
    overdue: { variant: 'destructive', label: 'Overdue' },
  };
  const s = map[status] || map.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function DashboardPage() {
  const { invoices, markAsPaid, addLog, user } = useApp();

  const stats = useMemo(() => {
    const total = invoices.length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    const dueSoon = invoices.filter(i => i.status === 'due_soon').length;
    const outstanding = invoices.filter(i => !i.paid).reduce((s, i) => s + i.total_amount, 0);
    return { total, overdue, dueSoon, outstanding };
  }, [invoices]);

  const kpis = [
    { label: 'Total Invoices', value: stats.total, icon: FileText, color: 'text-primary' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Due Soon', value: stats.dueSoon, icon: Clock, color: 'text-warning' },
    { label: 'Outstanding', value: `£${stats.outstanding.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
  ];

  const handleDownload = (inv: { id: string; invoice_number: string }) => {
    addLog({ user_id: user?.id || '', invoice_id: inv.id, action_type: 'invoice_downloaded', description: `Invoice ${inv.invoice_number} downloaded` });
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
                {invoices.slice(0, 10).map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="p-3 text-foreground">{inv.client_name}</td>
                    <td className="p-3 text-muted-foreground">{inv.client_company}</td>
                    <td className="p-3 text-right font-medium text-foreground">£{inv.total_amount.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="p-3">{statusBadge(inv.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!inv.paid && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(inv.id)} className="h-8 text-xs">
                            <Check className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(inv)} className="h-8 text-xs">
                          <Download className="h-3 w-3" />
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
    </DashboardLayout>
  );
}
