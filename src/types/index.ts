export interface User {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  currency: string;
  plan: 'free' | 'pro';
  created_at: string;
}

export interface UserAccess {
  user_id: string;
  role: string;
  is_active: boolean;
}

export interface UserPagePermissions {
  user_id: string;
  dashboard: boolean;
  create_invoice: boolean;
  my_invoices: boolean;
  activity_logs: boolean;
  pro_plan: boolean;
  settings: boolean;
  review_feedback: boolean;
  admin_user_management: boolean;
  admin_system_logs: boolean;
  admin_invoice_reports: boolean;
  admin_survey_reports: boolean;
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
  invoice_code: string;
  invoice_type: 'regular' | 'hourly';
  client_name: string;
  client_email: string;
  client_company: string;
  your_company_name: string | null;
  invoice_reference: string;
  invoice_date: string;
  due_date: string;
  subtotal_amount: number;
  vat_percent: number;
  tax_percent: number;
  vat_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'due_soon' | 'overdue' | 'paid' | 'cancelled';
  paid: boolean;
  paid_date: string | null;
  cancelled_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  reminder_email_subject: string | null;
  email_body: string | null;
  reminder_before_3: boolean;
  reminder_due: boolean;
  reminder_after_3: boolean;
  reminder_after_7: boolean;
  reminder_after_14: boolean;
  before_3_sent: boolean;
  due_sent: boolean;
  after_3_sent: boolean;
  after_7_sent: boolean;
  after_14_sent: boolean;
  logo_url: string | null;
  invoice_file_path: string | null;
  invoice_file_name: string | null;
  created_at: string;
  items: InvoiceItem[];
}

export interface ActivityLog {
  id: string;
  log_code: string;
  user_id: string;
  actor_user_id: string | null;
  related_user_id: string | null;
  invoice_id: string | null;
  action_type: string;
  description: string;
  meta: Record<string, any> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: string;
  renews_at: string | null;
}
