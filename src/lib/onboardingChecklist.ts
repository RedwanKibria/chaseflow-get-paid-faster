export interface ChecklistInput {
  hasBranding: boolean;       // company name or logo saved
  invoiceCount: number;       // non-deleted invoices
  anySent: boolean;           // an invoice was sent now or a reminder has gone out
}

export interface ChecklistItem {
  key: 'branding' | 'invoice' | 'send';
  label: string;
  hint: string;
  to: string;
  done: boolean;
}

/** The three first steps shown on an empty dashboard. */
export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    { key: 'branding', label: 'Add your company name and logo', hint: 'They appear on every invoice and PDF.', to: '/settings', done: input.hasBranding },
    { key: 'invoice', label: 'Create your first invoice', hint: 'Regular or hourly, with a live preview.', to: '/create-invoice', done: input.invoiceCount > 0 },
    { key: 'send', label: 'Send an invoice or schedule reminders', hint: 'Tick the reminders you want and ChaseFlow chases for you.', to: '/create-invoice', done: input.anySent },
  ];
}

export function checklistComplete(items: ChecklistItem[]): boolean {
  return items.every(i => i.done);
}
