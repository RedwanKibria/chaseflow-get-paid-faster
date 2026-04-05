import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Download, Search, Pencil } from 'lucide-react';

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

export default function MyInvoicesPage() {
  const { invoices, markAsPaid, addLog, user } = useApp();
  const [filterName, setFilterName] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (filterName && !inv.client_name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterCompany && !inv.client_company.toLowerCase().includes(filterCompany.toLowerCase())) return false;
      if (filterDateFrom && inv.due_date < filterDateFrom) return false;
      if (filterDateTo && inv.due_date > filterDateTo) return false;
      return true;
    });
  }, [invoices, filterName, filterCompany, filterDateFrom, filterDateTo]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };

  const handleDownload = (id: string) => {
    addLog({ user_id: user?.id || 'usr_001', invoice_id: id, action_type: 'invoice_downloaded', description: `Invoice ${id} downloaded` });
  };

  const handleBulkDownload = () => {
    selected.forEach(id => handleDownload(id));
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">My Invoices</h1>
            <p className="text-muted-foreground">Manage and track all your invoices</p>
          </div>
          {selected.size > 0 && (
            <Button variant="outline" onClick={handleBulkDownload}>
              <Download className="h-4 w-4 mr-2" /> Download ({selected.size})
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by client name" value={filterName} onChange={e => setFilterName(e.target.value)} className="pl-9" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input placeholder="Filter by company" value={filterCompany} onChange={e => setFilterCompany(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-40" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 w-10">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3"><Checkbox checked={selected.has(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} /></td>
                    <td className="p-3 font-medium text-foreground">{inv.id}</td>
                    <td className="p-3 text-foreground">{inv.client_name}</td>
                    <td className="p-3 text-muted-foreground">{inv.client_company}</td>
                    <td className="p-3 text-muted-foreground">{inv.client_email}</td>
                    <td className="p-3 text-right font-medium text-foreground">£{inv.total_amount.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="p-3">{statusBadge(inv.status)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!inv.paid && (
                          <Button size="sm" variant="outline" onClick={() => markAsPaid(inv.id)} className="h-7 text-xs">
                            <Check className="h-3 w-3 mr-1" /> Paid
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(inv.id)} className="h-7 text-xs">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No invoices found matching your filters.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
