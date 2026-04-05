import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Invoice, ActivityLog, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  invoices: Invoice[];
  activityLogs: ActivityLog[];
  isProDemo: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  addInvoice: (inv: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'status'>) => Promise<void>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  setProDemo: (v: boolean) => void;
  updateUser: (u: Partial<User>) => void;
  refreshInvoices: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isProDemo, setIsProDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Defer profile fetch to avoid Supabase deadlock
        setTimeout(() => fetchProfile(sess.user.id, sess.user.email ?? ''), 0);
      } else {
        setUser(null);
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

  // Fetch profile from users_profile
  const fetchProfile = async (uid: string, email: string) => {
    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', uid)
      .single();

    setUser({
      id: uid,
      full_name: data?.full_name ?? '',
      email: data?.email ?? email,
      plan: (data?.plan as 'free' | 'pro') ?? 'free',
      created_at: data?.created_at ?? new Date().toISOString(),
    });
  };

  // Fetch invoices with items when user changes
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

    // Fetch all items for these invoices
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
      invoice_type: r.invoice_type as 'regular' | 'hourly',
      client_name: r.client_name,
      client_email: r.client_email ?? '',
      client_company: r.client_company ?? '',
      invoice_reference: r.invoice_reference ?? '',
      invoice_date: r.invoice_date,
      due_date: r.due_date,
      total_amount: Number(r.total_amount),
      status: r.status as Invoice['status'],
      paid: r.paid,
      paid_date: r.paid_date,
      reminder_email_body: r.reminder_email_body ?? '',
      reminder_before_3: r.reminder_before_3,
      reminder_due: r.reminder_due,
      reminder_after_3: r.reminder_after_3,
      reminder_after_7: r.reminder_after_7,
      reminder_after_14: r.reminder_after_14,
      logo_url: r.logo_url,
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
      setActivityLogs(data as ActivityLog[]);
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

  const addLog = useCallback(async (log: Omit<ActivityLog, 'id' | 'created_at'>) => {
    await supabase.from('activity_logs').insert({
      user_id: log.user_id,
      invoice_id: log.invoice_id,
      action_type: log.action_type,
      description: log.description,
    });
    refreshLogs();
  }, [refreshLogs]);

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'status'>) => {
    if (!session?.user) return;
    const { data: inserted, error } = await supabase
      .from('invoices')
      .insert({
        user_id: session.user.id,
        invoice_type: inv.invoice_type,
        client_name: inv.client_name,
        client_email: inv.client_email,
        client_company: inv.client_company,
        invoice_reference: inv.invoice_reference,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount: inv.total_amount,
        paid: inv.paid,
        reminder_email_body: inv.reminder_email_body,
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

    // Insert items
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

    // Create reminder jobs
    await supabase.rpc('create_reminder_jobs_for_invoice', { p_invoice_id: inserted.id });

    await addLog({
      user_id: session.user.id,
      invoice_id: inserted.id,
      action_type: 'invoice_created',
      description: `Invoice created for ${inv.client_company || inv.client_name}`,
    });

    await refreshInvoices();
  }, [session, addLog, refreshInvoices]);

  const updateInvoice = useCallback(async (inv: Invoice) => {
    await supabase
      .from('invoices')
      .update({
        client_name: inv.client_name,
        client_email: inv.client_email,
        client_company: inv.client_company,
        invoice_reference: inv.invoice_reference,
        due_date: inv.due_date,
        total_amount: inv.total_amount,
        reminder_email_body: inv.reminder_email_body,
        reminder_before_3: inv.reminder_before_3,
        reminder_due: inv.reminder_due,
        reminder_after_3: inv.reminder_after_3,
        reminder_after_7: inv.reminder_after_7,
        reminder_after_14: inv.reminder_after_14,
      })
      .eq('id', inv.id);

    await addLog({
      user_id: inv.user_id,
      invoice_id: inv.id,
      action_type: 'invoice_edited',
      description: `Invoice edited`,
    });

    await refreshInvoices();
  }, [addLog, refreshInvoices]);

  const markAsPaid = useCallback(async (id: string) => {
    await supabase
      .from('invoices')
      .update({ paid: true })
      .eq('id', id);

    if (session?.user) {
      await addLog({
        user_id: session.user.id,
        invoice_id: id,
        action_type: 'invoice_paid',
        description: `Invoice marked as paid`,
      });
    }

    await refreshInvoices();
  }, [session, addLog, refreshInvoices]);

  const updateUser = useCallback(async (u: Partial<User>) => {
    if (!session?.user) return;
    await supabase
      .from('users_profile')
      .update({ full_name: u.full_name, email: u.email })
      .eq('id', session.user.id);
    setUser(prev => prev ? { ...prev, ...u } : prev);
  }, [session]);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!session,
      invoices,
      activityLogs,
      isProDemo,
      loading,
      login, signup, logout,
      addInvoice, updateInvoice, markAsPaid,
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
