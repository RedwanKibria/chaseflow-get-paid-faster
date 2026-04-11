import { Invoice, ActivityLog, User, InvoiceItem } from '@/types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const mockUser: User = {
  id: 'usr_001',
  full_name: 'Alex Morgan',
  email: 'alex@chaseflow.io',
  company_name: 'ChaseFlow Ltd',
  currency: 'GBP',
  plan: 'free',
  created_at: '2024-01-15T10:00:00Z',
};

function makeItem(invoiceId: string, no: number, desc: string, qty: number, amt: number, hours: number, rate: number, type: 'regular' | 'hourly'): InvoiceItem {
  return {
    id: `item_${invoiceId}_${no}`,
    invoice_id: invoiceId,
    item_no: no,
    description: desc,
    quantity: type === 'regular' ? qty : 0,
    unit_amount: type === 'regular' ? amt : 0,
    hours: type === 'hourly' ? hours : 0,
    hourly_rate: type === 'hourly' ? rate : 0,
    item_total: type === 'regular' ? qty * amt : hours * rate,
  };
}

const defaultInv = {
  your_company_name: null,
  subtotal_amount: 0,
  vat_percent: 0,
  tax_percent: 0,
  vat_amount: 0,
  tax_amount: 0,
  cancelled_at: null,
  is_deleted: false,
  deleted_at: null,
  reminder_email_subject: null,
  email_body: null,
  before_3_sent: false,
  due_sent: false,
  after_3_sent: false,
  after_7_sent: false,
  after_14_sent: false,
  invoice_file_path: null,
  invoice_file_name: null,
};

export const mockInvoices: Invoice[] = [
  {
    ...defaultInv,
    id: 'INV-001', user_id: 'usr_001', invoice_code: 'INV-000001', invoice_type: 'regular',
    client_name: 'Sarah Chen', client_email: 'sarah@greenoak.co.uk', client_company: 'Green Oak Consulting Ltd',
    invoice_reference: 'GO-2024-Q1', invoice_date: fmt(addDays(today, -30)), due_date: fmt(addDays(today, -5)),
    total_amount: 3200, subtotal_amount: 3200, status: 'overdue', paid: false, paid_date: null,
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: true, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -30)),
    items: [
      makeItem('INV-001', 1, 'Strategy consultation', 2, 800, 0, 0, 'regular'),
      makeItem('INV-001', 2, 'Market research report', 1, 1600, 0, 0, 'regular'),
    ],
  },
  {
    ...defaultInv,
    id: 'INV-002', user_id: 'usr_001', invoice_code: 'INV-000002', invoice_type: 'hourly',
    client_name: 'James Wright', client_email: 'james@brightspark.media', client_company: 'BrightSpark Media',
    invoice_reference: 'BSM-FEB', invoice_date: fmt(addDays(today, -20)), due_date: fmt(addDays(today, -3)),
    total_amount: 4500, subtotal_amount: 4500, status: 'overdue', paid: false, paid_date: null,
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -20)),
    items: [
      makeItem('INV-002', 1, 'Video production', 0, 0, 20, 150, 'hourly'),
      makeItem('INV-002', 2, 'Post-production editing', 0, 0, 10, 150, 'hourly'),
    ],
  },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log_001', log_code: 'LOG-000001', user_id: 'usr_001', actor_user_id: 'usr_001', related_user_id: null, invoice_id: 'INV-001', action_type: 'invoice_created', description: 'Invoice INV-000001 created for Green Oak Consulting Ltd', meta: null, created_at: mockInvoices[0].created_at + 'T09:30:00Z' },
  { id: 'log_002', log_code: 'LOG-000002', user_id: 'usr_001', actor_user_id: 'usr_001', related_user_id: null, invoice_id: 'INV-002', action_type: 'invoice_created', description: 'Invoice INV-000002 created for BrightSpark Media', meta: null, created_at: mockInvoices[1].created_at + 'T11:00:00Z' },
];
