import { Invoice, ActivityLog, User, InvoiceItem } from '@/types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const mockUser: User = {
  id: 'usr_001',
  full_name: 'Alex Morgan',
  email: 'alex@chaseflow.io',
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

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001', user_id: 'usr_001', invoice_type: 'regular',
    client_name: 'Sarah Chen', client_email: 'sarah@greenoak.co.uk', client_company: 'Green Oak Consulting Ltd',
    invoice_reference: 'GO-2024-Q1', invoice_date: fmt(addDays(today, -30)), due_date: fmt(addDays(today, -5)),
    total_amount: 3200, status: 'overdue', paid: false, paid_date: null,
    reminder_email_body: 'Dear Sarah, this is a friendly reminder that invoice INV-001 for £3,200.00 is now overdue. Please arrange payment at your earliest convenience.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: true, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -30)),
    items: [
      makeItem('INV-001', 1, 'Strategy consultation', 2, 800, 0, 0, 'regular'),
      makeItem('INV-001', 2, 'Market research report', 1, 1600, 0, 0, 'regular'),
    ],
  },
  {
    id: 'INV-002', user_id: 'usr_001', invoice_type: 'hourly',
    client_name: 'James Wright', client_email: 'james@brightspark.media', client_company: 'BrightSpark Media',
    invoice_reference: 'BSM-FEB', invoice_date: fmt(addDays(today, -20)), due_date: fmt(addDays(today, -3)),
    total_amount: 4500, status: 'overdue', paid: false, paid_date: null,
    reminder_email_body: 'Dear James, this is a friendly reminder that invoice INV-002 for £4,500.00 is now overdue.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -20)),
    items: [
      makeItem('INV-002', 1, 'Video production', 0, 0, 20, 150, 'hourly'),
      makeItem('INV-002', 2, 'Post-production editing', 0, 0, 10, 150, 'hourly'),
    ],
  },
  {
    id: 'INV-003', user_id: 'usr_001', invoice_type: 'regular',
    client_name: 'Priya Patel', client_email: 'priya@apexit.co.uk', client_company: 'Apex IT Services',
    invoice_reference: 'APEX-001', invoice_date: fmt(addDays(today, -10)), due_date: fmt(addDays(today, 2)),
    total_amount: 1850, status: 'due_soon', paid: false, paid_date: null,
    reminder_email_body: 'Dear Priya, this is a reminder that invoice INV-003 for £1,850.00 is due on ' + fmt(addDays(today, 2)) + '.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: false, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -10)),
    items: [
      makeItem('INV-003', 1, 'Network audit', 1, 1200, 0, 0, 'regular'),
      makeItem('INV-003', 2, 'Security assessment', 1, 650, 0, 0, 'regular'),
    ],
  },
  {
    id: 'INV-004', user_id: 'usr_001', invoice_type: 'hourly',
    client_name: 'Tom Bradley', client_email: 'tom@northlane.studio', client_company: 'Northlane Studio',
    invoice_reference: 'NLS-MAR', invoice_date: fmt(addDays(today, -7)), due_date: fmt(addDays(today, 1)),
    total_amount: 2400, status: 'due_soon', paid: false, paid_date: null,
    reminder_email_body: 'Dear Tom, invoice INV-004 for £2,400.00 is due soon. Please ensure timely payment.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -7)),
    items: [
      makeItem('INV-004', 1, 'UI/UX design', 0, 0, 16, 100, 'hourly'),
      makeItem('INV-004', 2, 'Prototyping', 0, 0, 8, 100, 'hourly'),
    ],
  },
  {
    id: 'INV-005', user_id: 'usr_001', invoice_type: 'regular',
    client_name: 'Emma Collins', client_email: 'emma@bluepeak.co', client_company: 'BluePeak Advisory',
    invoice_reference: 'BPA-Q1', invoice_date: fmt(addDays(today, -5)), due_date: fmt(addDays(today, 25)),
    total_amount: 5600, status: 'pending', paid: false, paid_date: null,
    reminder_email_body: 'Dear Emma, this is a reminder regarding invoice INV-005 for £5,600.00.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: true, reminder_after_14: true,
    logo_url: null, created_at: fmt(addDays(today, -5)),
    items: [
      makeItem('INV-005', 1, 'Financial advisory retainer', 1, 4000, 0, 0, 'regular'),
      makeItem('INV-005', 2, 'Quarterly report', 2, 800, 0, 0, 'regular'),
    ],
  },
  {
    id: 'INV-006', user_id: 'usr_001', invoice_type: 'regular',
    client_name: 'David Kim', client_email: 'david@clearpath.digital', client_company: 'ClearPath Digital',
    invoice_reference: 'CPD-2024', invoice_date: fmt(addDays(today, -3)), due_date: fmt(addDays(today, 27)),
    total_amount: 2100, status: 'pending', paid: false, paid_date: null,
    reminder_email_body: 'Dear David, this is a reminder regarding invoice INV-006 for £2,100.00.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: false, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -3)),
    items: [
      makeItem('INV-006', 1, 'SEO optimization', 3, 700, 0, 0, 'regular'),
    ],
  },
  {
    id: 'INV-007', user_id: 'usr_001', invoice_type: 'hourly',
    client_name: 'Mike Thompson', client_email: 'mike@horizonbuild.co', client_company: 'Horizon Build Co',
    invoice_reference: 'HBC-JAN', invoice_date: fmt(addDays(today, -60)), due_date: fmt(addDays(today, -30)),
    total_amount: 3750, status: 'paid', paid: true, paid_date: fmt(addDays(today, -28)),
    reminder_email_body: 'Dear Mike, thank you for your payment.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: false, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -60)),
    items: [
      makeItem('INV-007', 1, 'Architecture consultation', 0, 0, 15, 150, 'hourly'),
      makeItem('INV-007', 2, 'Site planning', 0, 0, 10, 150, 'hourly'),
    ],
  },
  {
    id: 'INV-008', user_id: 'usr_001', invoice_type: 'regular',
    client_name: 'Lisa Nguyen', client_email: 'lisa@novahealth.co', client_company: 'Nova Health Consulting',
    invoice_reference: 'NHC-DEC', invoice_date: fmt(addDays(today, -45)), due_date: fmt(addDays(today, -20)),
    total_amount: 4200, status: 'paid', paid: true, paid_date: fmt(addDays(today, -18)),
    reminder_email_body: 'Dear Lisa, thank you for your prompt payment.',
    reminder_before_3: true, reminder_due: true, reminder_after_3: true, reminder_after_7: false, reminder_after_14: false,
    logo_url: null, created_at: fmt(addDays(today, -45)),
    items: [
      makeItem('INV-008', 1, 'Health systems audit', 1, 2500, 0, 0, 'regular'),
      makeItem('INV-008', 2, 'Compliance review', 1, 1700, 0, 0, 'regular'),
    ],
  },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log_001', user_id: 'usr_001', invoice_id: 'INV-001', action_type: 'invoice_created', description: 'Invoice INV-001 created for Green Oak Consulting Ltd', created_at: mockInvoices[0].created_at + 'T09:30:00Z' },
  { id: 'log_002', user_id: 'usr_001', invoice_id: 'INV-002', action_type: 'invoice_created', description: 'Invoice INV-002 created for BrightSpark Media', created_at: mockInvoices[1].created_at + 'T11:00:00Z' },
  { id: 'log_003', user_id: 'usr_001', invoice_id: 'INV-007', action_type: 'invoice_paid', description: 'Invoice INV-007 marked as paid — Horizon Build Co', created_at: mockInvoices[6].paid_date + 'T14:00:00Z' },
  { id: 'log_004', user_id: 'usr_001', invoice_id: 'INV-008', action_type: 'invoice_paid', description: 'Invoice INV-008 marked as paid — Nova Health Consulting', created_at: mockInvoices[7].paid_date + 'T16:30:00Z' },
  { id: 'log_005', user_id: 'usr_001', invoice_id: 'INV-003', action_type: 'invoice_created', description: 'Invoice INV-003 created for Apex IT Services', created_at: mockInvoices[2].created_at + 'T10:15:00Z' },
  { id: 'log_006', user_id: 'usr_001', invoice_id: 'INV-005', action_type: 'invoice_created', description: 'Invoice INV-005 created for BluePeak Advisory', created_at: mockInvoices[4].created_at + 'T08:45:00Z' },
];
