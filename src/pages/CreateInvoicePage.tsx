import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

interface CreateInvoiceProps {
  type: 'regular' | 'hourly';
}

export default function CreateInvoicePage({ type }: CreateInvoiceProps) {
  const { addInvoice, user } = useApp();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [yourCompanyName, setYourCompanyName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reference, setReference] = useState('');
  const [vatPercent, setVatPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [reminderSubject, setReminderSubject] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState<{ description: string; qty: number; amount: number; hours: number; rate: number }[]>([
    { description: '', qty: 1, amount: 0, hours: 0, rate: 0 },
  ]);

  const [reminders, setReminders] = useState({
    before_3: true, due: true, after_3: false, after_7: false, after_14: false,
  });

  const subtotal = useMemo(() => items.reduce((s, i) => s + (type === 'regular' ? i.qty * i.amount : i.hours * i.rate), 0), [items, type]);
  const vatAmount = useMemo(() => Math.round(subtotal * vatPercent) / 100, [subtotal, vatPercent]);
  const taxAmount = useMemo(() => Math.round(subtotal * taxPercent) / 100, [subtotal, taxPercent]);
  const total = subtotal + vatAmount + taxAmount;

  const defaultReminder = useMemo(() => {
    return `Dear ${clientName || '[Client Name]'},\n\nThis is a friendly reminder regarding your invoice${reference ? ` (ref: ${reference})` : ''} for £${total.toLocaleString()}.\n\nPlease arrange payment at your earliest convenience.\n\nKind regards,\n${user?.full_name || 'Your Name'}`;
  }, [clientName, reference, total, user]);

  const [emailBody, setEmailBody] = useState('');
  const displayEmail = emailBody || defaultReminder;

  const addItem = () => setItems(p => [...p, { description: '', qty: 1, amount: 0, hours: 0, rate: 0 }]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: string | number) => {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSave = async () => {
    setSaving(true);
    const invoiceItems = items.map((item, i) => ({
      id: '',
      invoice_id: '',
      item_no: i + 1,
      description: item.description,
      quantity: type === 'regular' ? item.qty : 0,
      unit_amount: type === 'regular' ? item.amount : 0,
      hours: type === 'hourly' ? item.hours : 0,
      hourly_rate: type === 'hourly' ? item.rate : 0,
      item_total: type === 'regular' ? item.qty * item.amount : item.hours * item.rate,
    }));

    await addInvoice({
      invoice_type: type,
      client_name: clientName,
      client_email: clientEmail,
      client_company: clientCompany,
      your_company_name: yourCompanyName || null,
      invoice_reference: reference,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      vat_percent: vatPercent,
      tax_percent: taxPercent,
      paid: false,
      reminder_email_subject: reminderSubject || null,
      email_body: displayEmail || null,
      reminder_before_3: reminders.before_3,
      reminder_due: reminders.due,
      reminder_after_3: reminders.after_3,
      reminder_after_7: reminders.after_7,
      reminder_after_14: reminders.after_14,
      logo_url: null,
      items: invoiceItems,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setClientName(''); setClientEmail(''); setClientCompany(''); setYourCompanyName('');
    setDueDate(''); setReference(''); setVatPercent(0); setTaxPercent(0); setReminderSubject('');
    setItems([{ description: '', qty: 1, amount: 0, hours: 0, rate: 0 }]);
    setEmailBody('');
  };

  const isHourly = type === 'hourly';

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Create Invoice — {isHourly ? 'Hourly' : 'Regular'}
        </h1>
        <p className="text-muted-foreground mb-8">Fill in the details and preview your invoice live</p>

        {saved && (
          <div className="mb-6 p-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium">
            ✓ Invoice saved successfully! It's now visible in Dashboard and My Invoices.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client Name</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label>Client Email</Label>
                  <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="john@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client Company</Label>
                  <Input value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Acme Ltd" />
                </div>
                <div className="space-y-1.5">
                  <Label>Your Company Name (optional)</Label>
                  <Input value={yourCompanyName} onChange={e => setYourCompanyName(e.target.value)} placeholder="Your Business Ltd" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice Reference (optional)</Label>
                  <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="PO-12345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>VAT % (optional)</Label>
                  <Input type="number" min={0} max={100} value={vatPercent || ''} onChange={e => setVatPercent(+e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>TAX % (optional)</Label>
                  <Input type="number" min={0} max={100} value={taxPercent || ''} onChange={e => setTaxPercent(+e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Invoice Items</h3>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-3">
                    <span className="text-xs text-muted-foreground w-6 pb-2">{idx + 1}</span>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service description" />
                    </div>
                    {isHourly ? (
                      <>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Hours</Label>
                          <Input type="number" value={item.hours || ''} onChange={e => updateItem(idx, 'hours', +e.target.value)} />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Rate (£)</Label>
                          <Input type="number" value={item.rate || ''} onChange={e => updateItem(idx, 'rate', +e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input type="number" value={item.qty || ''} onChange={e => updateItem(idx, 'qty', +e.target.value)} />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Amount (£)</Label>
                          <Input type="number" value={item.amount || ''} onChange={e => updateItem(idx, 'amount', +e.target.value)} />
                        </div>
                      </>
                    )}
                    <div className="w-24 pb-0.5 text-right text-sm font-medium text-foreground">
                      £{(isHourly ? item.hours * item.rate : item.qty * item.amount).toLocaleString()}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length === 1} className="pb-0.5">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-1">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
                  <span className="text-sm text-muted-foreground">Subtotal: £{subtotal.toLocaleString()}</span>
                </div>
                {vatPercent > 0 && (
                  <div className="flex justify-end text-sm text-muted-foreground">
                    VAT ({vatPercent}%): £{vatAmount.toLocaleString()}
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-end text-sm text-muted-foreground">
                    TAX ({taxPercent}%): £{taxAmount.toLocaleString()}
                  </div>
                )}
                <div className="flex justify-end">
                  <span className="text-lg font-bold text-foreground">Total: £{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Reminder Settings</h3>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'before_3' as const, label: '3 days before' },
                  { key: 'due' as const, label: 'On due date' },
                  { key: 'after_3' as const, label: '3 days after' },
                  { key: 'after_7' as const, label: '7 days after' },
                  { key: 'after_14' as const, label: '14 days after' },
                ].map(r => (
                  <label key={r.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={reminders[r.key]}
                      onCheckedChange={v => setReminders(p => ({ ...p, [r.key]: !!v }))}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card space-y-3">
              <h3 className="font-semibold text-foreground">Email Reminder</h3>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={reminderSubject} onChange={e => setReminderSubject(e.target.value)} placeholder="Payment Reminder — Invoice" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Body</Label>
                <Textarea
                  rows={8}
                  value={displayEmail}
                  onChange={e => setEmailBody(e.target.value)}
                  className="text-sm"
                />
              </div>
              <p className="text-sm font-bold text-foreground">Please add your Bank/Online transfer details in the mail</p>
            </div>

            <Button onClick={handleSave} className="w-full h-11" disabled={!clientName || !dueDate || saving}>
              {saving ? 'Saving…' : 'Save Invoice'}
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="bg-card rounded-xl shadow-card p-8 h-fit sticky top-8">
            <div className="border-b border-border pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <span className="text-primary font-bold text-lg">C</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{yourCompanyName || 'Your Business Name'}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-foreground">INVOICE</h2>
                  <p className="text-sm text-muted-foreground">New Invoice</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Bill To</p>
                <p className="font-medium text-foreground">{clientName || 'Client Name'}</p>
                <p className="text-muted-foreground">{clientCompany || 'Company'}</p>
                <p className="text-muted-foreground">{clientEmail || 'email@example.com'}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground mb-1">Invoice Date</p>
                <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                <p className="text-muted-foreground mt-2 mb-1">Due Date</p>
                <p className="font-medium text-foreground">{dueDate || '—'}</p>
                {reference && <>
                  <p className="text-muted-foreground mt-2 mb-1">Reference</p>
                  <p className="font-medium text-foreground">{reference}</p>
                </>}
              </div>
            </div>
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">{isHourly ? 'Hours' : 'Qty'}</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">{isHourly ? 'Rate' : 'Price'}</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 text-foreground">{item.description || '—'}</td>
                    <td className="py-2 text-right text-foreground">{isHourly ? item.hours : item.qty}</td>
                    <td className="py-2 text-right text-foreground">£{isHourly ? item.rate : item.amount}</td>
                    <td className="py-2 text-right font-medium text-foreground">£{(isHourly ? item.hours * item.rate : item.qty * item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Subtotal: <span className="text-foreground font-medium">£{subtotal.toLocaleString()}</span></p>
                {vatPercent > 0 && (
                  <p className="text-sm text-muted-foreground">VAT ({vatPercent}%): <span className="text-foreground font-medium">£{vatAmount.toLocaleString()}</span></p>
                )}
                {taxPercent > 0 && (
                  <p className="text-sm text-muted-foreground">TAX ({taxPercent}%): <span className="text-foreground font-medium">£{taxAmount.toLocaleString()}</span></p>
                )}
                <p className="text-3xl font-bold text-foreground">£{total.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>Payment Terms: Please pay within the due date specified above.</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
