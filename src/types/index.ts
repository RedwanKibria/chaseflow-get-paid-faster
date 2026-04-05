export interface User {
  id: string;
  full_name: string;
  email: string;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_no: number;
  description: string;
  quantity: number;
  unit_amount: number;
  hours: number;
  hourly_rate: number;
  item_total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_type: 'regular' | 'hourly';
  client_name: string;
  client_email: string;
  client_company: string;
  invoice_reference: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: 'pending' | 'due_soon' | 'overdue' | 'paid';
  paid: boolean;
  paid_date: string | null;
  reminder_email_body: string;
  reminder_before_3: boolean;
  reminder_due: boolean;
  reminder_after_3: boolean;
  reminder_after_7: boolean;
  reminder_after_14: boolean;
  logo_url: string | null;
  created_at: string;
  items: InvoiceItem[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  invoice_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled';
  renews_at: string;
}
