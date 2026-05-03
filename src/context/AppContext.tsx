import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Invoice, ActivityLog, User, UserAccess, UserPagePermissions } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { generateAndUploadInvoicePdf } from '@/lib/invoiceStorage';
import { getCurrencySymbol } from '@/lib/currency';
import type { Session } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  userAccess: UserAccess | null;
  permissions: UserPagePermissions | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isActive: boolean;
  invoices: Invoice[];
  activityLogs: ActivityLog[];
  isProDemo: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  addInvoice: (inv: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'status' | 'invoice_code' | 'subtotal_amount' | 'vat_amount' | 'tax_amount' | 'total_amount' | 'paid_date' | 'cancelled_at' | 'is_deleted' | 'deleted_at' | 'before_3_sent' | 'due_sent' | 'after_3_sent' | 'after_7_sent' | 'after_14_sent' | 'invoice_file_path' | 'invoice_file_name'>) => Promise<void>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  softDeleteInvoice: (id: string) => Promise<void>;
  addLog: (log: { invoice_id?: string | null; action_type: string; description: string }) => void;
  setProDemo: (v: boolean) => void;
  updateUser: (u: Partial<User>) => void;
  refreshInvoices: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [permissions, setPermissions] = useState<UserPagePermissions | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isProDemo, setIsProDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = userAccess?.role === 'admin';
  const isActive = userAccess?.is_active ?? false;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => fetchProfile(sess.user.id, sess.user.email ?? ''), 0);
      } else {
        setUser(null);
        setUserAccess(null);
        setPermissions(null);
        setInvoices([]);
        setActivityLogs([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        fetchProfile(sess.user.id, sess.user.email ?? '');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string, email: string) => {
    const [{ data: profile }, { data: access }, { data: perms }] = await Promise.all([
      supabase.from('users_profile').select('*').eq('id', uid).single(),
      supabase.from('user_access').select('*').eq('user_id', uid).single(),
      supabase.from('user_page_permissions').select('*').eq('user_id', uid).single(),
    ]);

    setUser({
      id: uid,
      full_name: profile?.full_name ?? '',
      email: profile?.email ?? email,
      company_name: profile?.company_name ?? null,
      currency: (profile as any)?.currency ?? 'GBP',
      plan: (profile?.plan as 'free' | 'pro') ?? 'free',
      created_at: profile?.created_at ?? new Date().toISOString(),
    });

    if (access) {
      setUserAccess({ user_id: access.user_id, role: access.role, is_active: access.is_active });
    }
    if (perms) {
      setPermissions(perms as unknown as UserPagePermissions);
    }
  };

  useEffect(() => {
    if (user) {
      refreshInvoices();
      refreshLogs();
    }
  }, [user?.id]);

  const refreshInvoices = useCallback(async () => {
    if (!session?.user) return;
    const { data: invRows } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!invRows) return;

    const invIds = invRows.map(i => i.id);
    const { data: itemRows } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invIds.length ? invIds : ['__none__']);

    const itemsByInvoice = (itemRows ?? []).reduce<Record<string, any[]>>((acc, item) => {
      (acc[item.invoice_id] ??= []).push(item);
      return acc;
    }, {});

    const mapped: Invoice[] = invRows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      invoice_code: (r as any).invoice_code ?? r.invoice_number ?? r.id,
      invoice_type: r.invoice_type as 'regular' | 'hourly',
      client_name: r.client_name,
      client_email: r.client_email ?? '',
      client_company: r.client_company ?? '',
      your_company_name: r.your_company_name ?? null,
      invoice_reference: r.invoice_reference ?? '',
      invoice_date: r.invoice_date,
      due_date: r.due_date,
      subtotal_amount: Number(r.subtotal_amount ?? 0),
      vat_percent: Number(r.vat_percent ?? 0),
      tax_percent: Number(r.tax_percent ?? 0),
      vat_amount: Number(r.vat_amount ?? 0),
      tax_amount: Number(r.tax_amount ?? 0),
      total_amount: Number(r.total_amount),
      status: r.status as Invoice['status'],
      paid: r.paid,
      paid_date: r.paid_date,
      cancelled_at: r.cancelled_at ?? null,
      is_deleted: r.is_deleted ?? false,
      deleted_at: r.deleted_at ?? null,
      reminder_email_subject: r.reminder_email_subject ?? null,
      email_body: r.email_body ?? null,
      reminder_before_3: r.reminder_before_3,
      reminder_due: r.reminder_due,
      reminder_after_3: r.reminder_after_3,
      reminder_after_7: r.reminder_after_7,
      reminder_after_14: r.reminder_after_14,
      before_3_sent: r.before_3_sent ?? false,
      due_sent: r.due_sent ?? false,
      after_3_sent: r.after_3_sent ?? false,
      after_7_sent: r.after_7_sent ?? false,
      after_14_sent: r.after_14_sent ?? false,
      logo_url: r.logo_url,
      invoice_file_path: r.invoice_file_path ?? null,
      invoice_file_name: r.invoice_file_name ?? null,
      created_at: r.created_at,
      items: (itemsByInvoice[r.id] ?? []).map((it: any) => ({
        id: it.id,
        invoice_id: it.invoice_id,
        item_no: it.item_no,
        description: it.description,
        quantity: Number(it.quantity ?? 0),
        unit_amount: Number(it.unit_amount ?? 0),
        hours: Number(it.hours ?? 0),
        hourly_rate: Number(it.hourly_rate ?? 0),
        item_total: Number(it.item_total),
      })),
    }));

    setInvoices(mapped);
  }, [session]);

  const refreshLogs = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) {
      setActivityLogs(data.map((d: any) => ({
        id: d.id,
        log_code: d.log_code ?? d.log_number ?? d.id,
        user_id: d.user_id,
        actor_user_id: d.actor_user_id ?? null,
        related_user_id: d.related_user_id ?? null,
        invoice_id: d.invoice_id ?? null,
        action_type: d.action_type,
        description: d.description,
        meta: d.meta ?? null,
        created_at: d.created_at,
      })));
    }
  }, [session]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return error ? error.message : null;
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  const addLog = useCallback(async (log: { invoice_id?: string | null; action_type: string; description: string }) => {
    if (!session?.user) return;
    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      actor_user_id: session.user.id,
      invoice_id: log.invoice_id ?? null,
      action_type: log.action_type,
      description: log.description,
    });
    refreshLogs();
  }, [session, refreshLogs]);

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'status' | 'invoice_code' | 'subtotal_amount' | 'vat_amount' | 'tax_amount' | 'total_amount' | 'paid_date' | 'cancelled_at' | 'is_deleted' | 'deleted_at' | 'before_3_sent' | 'due_sent' | 'after_3_sent' | 'after_7_sent' | 'after_14_sent' | 'invoice_file_path' | 'invoice_file_name'>) => {
    if (!session?.user) return;
    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert({
        user_id: session.user.id,
        invoice_type: inv.invoice_type,
        client_name: inv.client_name,
        client_email: inv.client_email,
        client_company: inv.client_company,
        your_company_name: inv.your_company_name,
        invoice_reference: inv.invoice_reference,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        vat_percent: inv.vat_percent,
        tax_percent: inv.tax_percent,
        paid: inv.paid,
        reminder_email_subject: inv.reminder_email_subject,
        email_body: inv.email_body,
        reminder_before_3: inv.reminder_before_3,
        reminder_due: inv.reminder_due,
        reminder_after_3: inv.reminder_after_3,
        reminder_after_7: inv.reminder_after_7,
        reminder_after_14: inv.reminder_after_14,
        logo_url: inv.logo_url,
      })
      .select()
      .single();

    if (error || !inserted) return;

    if (inv.items.length > 0) {
      await supabase.from('invoice_items').insert(
        inv.items.map((item, i) => ({
          invoice_id: inserted.id,
          item_no: i + 1,
          description: item.description,
          quantity: item.quantity,
          unit_amount: item.unit_amount,
          hours: item.hours,
          hourly_rate: item.hourly_rate,
          item_total: item.item_total,
        }))
      );
    }

    // Refresh financials (subtotal, vat_amount, tax_amount, total_amount)
    await supabase.rpc('refresh_invoice_financials', { p_invoice_id: inserted.id });
    await supabase.rpc('create_reminder_jobs_for_invoice', { p_invoice_id: inserted.id });

    await addLog({
      invoice_id: inserted.id,
      action_type: 'invoice_created',
      description: `Invoice created for ${inv.client_company || inv.client_name}`,
    });

    await refreshInvoices();

    // Generate and upload PDF for attachment in reminder emails
    try {
      const { data: full } = await supabase.from('invoices').select('*, items:invoice_items(*)').eq('id', inserted.id).single();
      if (full) {
        const symbol = getCurrencySymbol(user?.currency || 'GBP');
        await generateAndUploadInvoicePdf(full as any, symbol);
      }
    } catch (e) { console.warn('PDF upload skipped:', e); }
  }, [session, addLog, refreshInvoices, user]);

  const updateInvoice = useCallback(async (inv: Invoice) => {
    await supabase
      .from('invoices')
      .update({
        client_name: inv.client_name,
        client_email: inv.client_email,
        client_company: inv.client_company,
        your_company_name: inv.your_company_name,
        invoice_reference: inv.invoice_reference,
        due_date: inv.due_date,
        vat_percent: inv.vat_percent,
        tax_percent: inv.tax_percent,
        reminder_email_subject: inv.reminder_email_subject,
        email_body: inv.email_body,
        reminder_before_3: inv.reminder_before_3,
        reminder_due: inv.reminder_due,
        reminder_after_3: inv.reminder_after_3,
        reminder_after_7: inv.reminder_after_7,
        reminder_after_14: inv.reminder_after_14,
      })
      .eq('id', inv.id);

    await addLog({
      invoice_id: inv.id,
      action_type: 'invoice_edited',
      description: `Invoice edited`,
    });

    await refreshInvoices();

    // Regenerate PDF on edit so attachment stays current
    try {
      const { data: full } = await supabase.from('invoices').select('*, items:invoice_items(*)').eq('id', inv.id).single();
      if (full) {
        const symbol = getCurrencySymbol(user?.currency || 'GBP');
        await generateAndUploadInvoicePdf(full as any, symbol);
      }
    } catch (e) { console.warn('PDF regenerate skipped:', e); }
  }, [addLog, refreshInvoices, user]);

  const markAsPaid = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('mark_invoice_paid', { p_invoice_id: id });
    if (error) console.error('markAsPaid error:', error.message);
    await refreshInvoices();
    await refreshLogs();
  }, [refreshInvoices, refreshLogs]);

  const cancelInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('cancel_invoice', { p_invoice_id: id });
    if (error) console.error('cancelInvoice error:', error.message);
    await refreshInvoices();
    await refreshLogs();
  }, [refreshInvoices, refreshLogs]);

  const softDeleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('soft_delete_invoice', { p_invoice_id: id });
    if (error) console.error('softDeleteInvoice error:', error.message);
    await refreshInvoices();
    await refreshLogs();
  }, [refreshInvoices, refreshLogs]);

  const updateUser = useCallback(async (u: Partial<User>) => {
    if (!session?.user) return;
    await supabase.rpc('update_my_profile', {
      p_full_name: u.full_name ?? user?.full_name ?? '',
      p_company_name: u.company_name ?? user?.company_name ?? '',
      p_currency: u.currency ?? user?.currency ?? 'GBP',
    });
    setUser(prev => prev ? { ...prev, ...u } : prev);
  }, [session, user]);

  return (
    <AppContext.Provider value={{
      user,
      userAccess,
      permissions,
      isAuthenticated: !!session,
      isAdmin,
      isActive,
      invoices,
      activityLogs,
      isProDemo,
      loading,
      login, signup, logout,
      addInvoice, updateInvoice, markAsPaid, cancelInvoice, softDeleteInvoice,
      addLog, setProDemo: setIsProDemo, updateUser,
      refreshInvoices, refreshLogs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
