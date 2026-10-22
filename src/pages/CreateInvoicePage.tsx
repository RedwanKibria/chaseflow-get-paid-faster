import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getCurrencySymbol } from '@/lib/currency';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Send, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resolveLogo } from '@/lib/branding';

interface CreateInvoiceProps {
  type: 'regular' | 'hourly';
}

export default function CreateInvoicePage({ type }: CreateInvoiceProps) {
  const { addInvoice, user } = useApp();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  useEffect(() => {
    let live = true; let url: string | null = null;
    resolveLogo(user?.logo_path).then(value => { url = value; if (live) setLogoPreview(value); else if (value) URL.revokeObjectURL(value); }).catch(() => setLogoPreview(null));
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [user?.logo_path]);
  const cs = getCurrencySymbol(user?.currency || 'GBP');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [yourCompanyName, setYourCompanyName] = useState(user?.company_name || '');
  const [dueDate, setDueDate] = useState('');
  const [reference, setReference] = useState('');
  const [vatPercent, setVatPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [reminderSubject, setReminderSubject] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState<null | 'now' | 'reminder'>(null);
  const [errors, setErrors] = useState<{ clientName?: string; clientEmail?: string; dueDate?: string; items?: string }>({});

  // Auto-prefill company name from settings whenever profile updates
  useEffect(() => {
    if (user?.company_name && !yourCompanyName) setYourCompanyName(user.company_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.company_name]);

  const [items, setItems] = useState<{ description: string; qty: number; amount: number; hours: number; rate: number }[]>([
    { description: '', qty: 1, amount: 0, hours: 0, rate: 0 },
  ]);

  const [reminders, setReminders] = useState({
    before_3: true, due: true, after_3: false, after_7: false, after_14: false,
  });
  const anyReminderSelected = Object.values(reminders).some(Boolean);

  const subtotal = useMemo(() => items.reduce((s, i) => s + (type === 'regular' ? i.qty * i.amount : i.hours * i.rate), 0), [items, type]);
  const vatAmount = useMemo(() => Math.round(subtotal * vatPercent) / 100, [subtotal, vatPercent]);
  const taxAmount = useMemo(() => Math.round(subtotal * taxPercent) / 100, [subtotal, taxPercent]);
  const total = subtotal + vatAmount + taxAmount;

  const defaultReminder = useMemo(() => {
    return `Dear ${clientName || '[Client Name]'},\n\nThis is a friendly reminder regarding your invoice${reference ? ` (ref: ${reference})` : ''} for ${cs}${total.toLocaleString()}.\n\nPlease arrange payment at your earliest convenience.\n\nKind regards,\n${user?.full_name || 'Your Name'}`;
  }, [clientName, reference, total, user, cs]);

  const [emailBody, setEmailBody] = useState('');
  const displayEmail = emailBody || defaultReminder;

  const addItem = () => setItems(p => [...p, { description: '', qty: 1, amount: 0, hours: 0, rate: 0 }]);
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: string | number) => {
    setItems(p => p.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!clientName.trim()) newErrors.clientName = 'Client Name is required';
    if (!clientEmail.trim()) newErrors.clientEmail = 'Client Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) newErrors.clientEmail = 'Enter a valid email address';
    if (!dueDate) newErrors.dueDate = 'Due Date is required';
    const hasValidItem = items.some(i => (i.description.trim() !== '') && (type === 'regular' ? (i.qty > 0 && i.amount > 0) : (i.hours > 0 && i.rate > 0)));
    if (!hasValidItem) newErrors.items = 'At least one item with description and amount is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill all required fields');
      return false;
    }
    return true;
  };

  const buildInvoicePayload = () => ({
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
    logo_url: user?.logo_path ?? null,
    items: items.map((item, i) => ({
      id: '', invoice_id: '',
      item_no: i + 1,
      description: item.description,
      quantity: type === 'regular' ? item.qty : 0,
      unit_amount: type === 'regular' ? item.amount : 0,
      hours: type === 'hourly' ? item.hours : 0,
      hourly_rate: type === 'hourly' ? item.rate : 0,
      item_total: type === 'regular' ? item.qty * item.amount : item.hours * item.rate,
    })),
  });

  const resetForm = () => {
    setClientName(''); setClientEmail(''); setClientCompany('');
    setYourCompanyName(user?.company_name || '');
    setDueDate(''); setReference(''); setVatPercent(0); setTaxPercent(0); setReminderSubject('');
    setItems([{ description: '', qty: 1, amount: 0, hours: 0, rate: 0 }]);
    setEmailBody('');
  };

  const reminderScheduleText = () => {
    const enabled: string[] = [];
    if (reminders.before_3) enabled.push('3 days before due');
    if (reminders.due) enabled.push('on due date');
    if (reminders.after_3) enabled.push('3 days after');
    if (reminders.after_7) enabled.push('7 days after');
    if (reminders.after_14) enabled.push('14 days after');
    return enabled;
  };

  const handleSaveReminderwise = async () => {
    if (!validate()) return;
    if (!anyReminderSelected) {
      toast.error('Select at least one reminder schedule');
      return;
    }
    setSaving('reminder');
    const id = await addInvoice(buildInvoicePayload());
    setSaving(null);
    if (!id) { toast.error('Failed to save invoice. Your entries have been kept.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 5000);
    const enabled = reminderScheduleText();
    toast.success('Invoice saved — reminderwise', {
      description: `Reminder emails will be sent to ${clientEmail} ${enabled.join(', ')}. Past dates are skipped automatically.`,
      duration: 7000,
    });
    resetForm();
  };

  const handleSendNow = async () => {
    if (!validate()) return;
    setSaving('now');
    const id = await addInvoice(buildInvoicePayload());
    if (!id) { setSaving(null); toast.error('Failed to save invoice'); return; }
    const { data, error } = await supabase.functions.invoke('send-invoice-now', { body: { invoice_id: id } });
    setSaving(null);
    if (error?.context instanceof Response && error.context.status === 429) {
      const response = await error.context.clone().json().catch(() => ({}));
      toast.error(response.error || response.message || 'Sending limit reached. Please try again later.');
      return;
    }
    if (error || (data as any)?.error) {
      toast.error('Invoice saved but email send failed', { description: String(error?.message || (data as any)?.error || 'Unknown error') });
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 5000);
    const enabled = reminderScheduleText();
    const future = enabled.length ? ` Future reminders: ${enabled.join(', ')} (past dates skipped).` : '';
    if (data?.attached === false) {
      toast.warning('Invoice sent, but the PDF could not be attached. Open My Invoices to download and resend it.');
    } else {
      toast.success(`Invoice sent now to ${clientEmail}`, {
        description: `PDF emailed immediately.${future}`,
        duration: 7000,
      });
    }
    resetForm();
  };

  const isHourly = type === 'hourly';

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Create Invoice — {isHourly ? 'Hourly' : 'Regular'}
        </h1>
        <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">Fill in the details and preview your invoice live</p>

        {saved && (
          <div className="mb-6 p-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium">
            ✓ Invoice processed successfully! Visible in Dashboard and My Invoices.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Client Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client Name <span className="text-destructive">*</span></Label>
                  <Input value={clientName} onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(p => ({ ...p, clientName: undefined })); }} placeholder="John Doe" aria-invalid={!!errors.clientName} className={errors.clientName ? 'border-destructive' : ''} />
                  {errors.clientName && <p className="text-xs text-destructive">{errors.clientName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Client Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={clientEmail} onChange={e => { setClientEmail(e.target.value); if (errors.clientEmail) setErrors(p => ({ ...p, clientEmail: undefined })); }} placeholder="john@company.com" aria-invalid={!!errors.clientEmail} className={errors.clientEmail ? 'border-destructive' : ''} />
                  {errors.clientEmail && <p className="text-xs text-destructive">{errors.clientEmail}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Client Company</Label>
                  <Input value={clientCompany} onChange={e => setClientCompany(e.target.value)} placeholder="Acme Ltd" />
                </div>
                <div className="space-y-1.5">
                  <Label>Your Company Name</Label>
                  <Input value={yourCompanyName} onChange={e => setYourCompanyName(e.target.value)} placeholder="Your Business Ltd" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Due Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); if (errors.dueDate) setErrors(p => ({ ...p, dueDate: undefined })); }} aria-invalid={!!errors.dueDate} className={errors.dueDate ? 'border-destructive' : ''} />
                  {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice Reference</Label>
                  <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="PO-12345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>VAT %</Label>
                  <Input type="number" min={0} max={100} value={vatPercent || ''} onChange={e => setVatPercent(+e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>TAX %</Label>
                  <Input type="number" min={0} max={100} value={taxPercent || ''} onChange={e => setTaxPercent(+e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 md:p-6 shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Invoice Items</h3>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3 sm:p-0 sm:border-0 sm:flex sm:items-end sm:gap-3 space-y-3 sm:space-y-0">
                    <span className="hidden sm:block text-xs text-muted-foreground w-6 pb-2">{idx + 1}</span>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Item #{idx + 1} — Description</Label>
                      <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service description" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:contents">
                      {isHourly ? (
                        <>
                          <div className="sm:w-20 space-y-1">
                            <Label className="text-xs">Hours</Label>
                            <Input type="number" value={item.hours || ''} onChange={e => updateItem(idx, 'hours', +e.target.value)} />
                          </div>
                          <div className="sm:w-24 space-y-1">
                            <Label className="text-xs">Rate</Label>
                            <Input type="number" value={item.rate || ''} onChange={e => updateItem(idx, 'rate', +e.target.value)} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="sm:w-20 space-y-1">
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" value={item.qty || ''} onChange={e => updateItem(idx, 'qty', +e.target.value)} />
                          </div>
                          <div className="sm:w-24 space-y-1">
                            <Label className="text-xs">Amount</Label>
                            <Input type="number" value={item.amount || ''} onChange={e => updateItem(idx, 'amount', +e.target.value)} />
                          </div>
                        </>
                      )}
                      <div className="sm:w-24 sm:pb-0.5 sm:text-right text-sm font-medium text-foreground self-end pb-2">
                        <span className="sm:hidden text-xs text-muted-foreground block">Line total</span>
                        {cs}{(isHourly ? item.hours * item.rate : item.qty * item.amount).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={items.length === 1} className="self-end">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              {errors.items && <p className="text-xs text-destructive mt-2">{errors.items}</p>}
              <div className="mt-4 pt-4 border-t border-border space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
                  <span className="text-sm text-muted-foreground">Subtotal: {cs}{subtotal.toLocaleString()}</span>
                </div>
                {vatPercent > 0 && (
                  <div className="flex justify-end text-sm text-muted-foreground">VAT ({vatPercent}%): {cs}{vatAmount.toLocaleString()}</div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-end text-sm text-muted-foreground">TAX ({taxPercent}%): {cs}{taxAmount.toLocaleString()}</div>
                )}
                <div className="flex justify-end">
                  <span className="text-lg font-bold text-foreground">Total: {cs}{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-foreground">Reminder Settings</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-3">
                {[
                  { key: 'before_3' as const, label: '3 days before' },
                  { key: 'due' as const, label: 'On due date' },
                  { key: 'after_3' as const, label: '3 days after' },
                  { key: 'after_7' as const, label: '7 days after' },
                  { key: 'after_14' as const, label: '14 days after' },
                ].map(r => (
                  <label key={r.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={reminders[r.key]} onCheckedChange={v => setReminders(p => ({ ...p, [r.key]: !!v }))} />
                    {r.label}
                  </label>
                ))}
              </div>
              {!anyReminderSelected && (
                <p className="text-xs text-muted-foreground">Select at least one reminder schedule to enable "Send Invoice Reminderwise".</p>
              )}
            </div>

            <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-3">
              <h3 className="font-semibold text-foreground">Email Reminder</h3>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={reminderSubject} onChange={e => setReminderSubject(e.target.value)} placeholder="Payment Reminder — Invoice" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Body</Label>
                <Textarea rows={8} value={displayEmail} onChange={e => setEmailBody(e.target.value)} className="text-sm" />
              </div>
              <p className="text-sm font-bold text-foreground">Please add your Bank/Online transfer details in the mail</p>
            </div>

            <div className="space-y-3 sticky bottom-0 sm:static bg-background sm:bg-transparent pt-2 pb-4 sm:p-0 -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-0 border-border">
              <Button
                onClick={handleSendNow}
                className="w-full h-12 text-base"
                disabled={saving !== null}
                variant="default"
              >
                <Send className="h-4 w-4 mr-2" />
                {saving === 'now' ? 'Sending…' : 'Send Invoice Now!'}
              </Button>
              <Button
                onClick={handleSaveReminderwise}
                className="w-full h-11"
                variant="outline"
                disabled={saving !== null || !anyReminderSelected}
                title={!anyReminderSelected ? 'Select at least one reminder schedule' : ''}
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                {saving === 'reminder' ? 'Saving…' : 'Send Invoice Reminderwise'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-medium">Send Now</span>: emails the PDF immediately, then schedules selected future reminders.
                <br />
                <span className="font-medium">Reminderwise</span>: emails the PDF only when each selected reminder fires.
              </p>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="bg-card rounded-xl shadow-card p-4 md:p-8 h-fit lg:sticky lg:top-8">
            <div className="border-b border-border pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  {logoPreview ? <img src={logoPreview} alt="Invoice logo" className="h-16 w-32 object-contain mb-2" /> : <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <span className="text-primary font-bold text-lg">C</span>
                  </div>}
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
                <p className="font-medium text-foreground break-words">{clientName || 'Client Name'}</p>
                <p className="text-muted-foreground break-words">{clientCompany || 'Company'}</p>
                <p className="text-muted-foreground break-all">{clientEmail || 'email@example.com'}</p>
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
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <table className="w-full text-sm mb-6 min-w-[420px]">
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
                      <td className="py-2 text-right text-foreground">{cs}{isHourly ? item.rate : item.amount}</td>
                      <td className="py-2 text-right font-medium text-foreground">{cs}{(isHourly ? item.hours * item.rate : item.qty * item.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Subtotal: <span className="text-foreground font-medium">{cs}{subtotal.toLocaleString()}</span></p>
                {vatPercent > 0 && (
                  <p className="text-sm text-muted-foreground">VAT ({vatPercent}%): <span className="text-foreground font-medium">{cs}{vatAmount.toLocaleString()}</span></p>
                )}
                {taxPercent > 0 && (
                  <p className="text-sm text-muted-foreground">TAX ({taxPercent}%): <span className="text-foreground font-medium">{cs}{taxAmount.toLocaleString()}</span></p>
                )}
                <p className="text-2xl md:text-3xl font-bold text-foreground">{cs}{total.toLocaleString()}</p>
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
