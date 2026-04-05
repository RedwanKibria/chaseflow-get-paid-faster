import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Invoice, ActivityLog, User } from '@/types';
import { mockUser, mockInvoices, mockActivityLogs } from '@/data/mockData';

function computeStatus(inv: Invoice): Invoice['status'] {
  if (inv.paid) return 'paid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(inv.due_date);
  due.setHours(0, 0, 0, 0);
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'due_soon';
  return 'pending';
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  invoices: Invoice[];
  activityLogs: ActivityLog[];
  isProDemo: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (inv: Invoice) => void;
  markAsPaid: (id: string) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  setProDemo: (v: boolean) => void;
  updateUser: (u: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(() => mockInvoices.map(i => ({ ...i, status: computeStatus(i) })));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [isProDemo, setIsProDemo] = useState(false);

  const login = useCallback((_email: string, _password: string) => {
    setUser({ ...mockUser });
  }, []);

  const signup = useCallback((name: string, email: string, _password: string) => {
    setUser({ ...mockUser, full_name: name, email });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const addLog = useCallback((log: Omit<ActivityLog, 'id' | 'created_at'>) => {
    setActivityLogs(prev => [{
      ...log,
      id: `log_${Date.now()}`,
      created_at: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const addInvoice = useCallback((inv: Invoice) => {
    const withStatus = { ...inv, status: computeStatus(inv) };
    setInvoices(prev => [withStatus, ...prev]);
    addLog({ user_id: inv.user_id, invoice_id: inv.id, action_type: 'invoice_created', description: `Invoice ${inv.id} created for ${inv.client_company}` });
  }, [addLog]);

  const updateInvoice = useCallback((inv: Invoice) => {
    const withStatus = { ...inv, status: computeStatus(inv) };
    setInvoices(prev => prev.map(i => i.id === inv.id ? withStatus : i));
    addLog({ user_id: inv.user_id, invoice_id: inv.id, action_type: 'invoice_edited', description: `Invoice ${inv.id} edited` });
  }, [addLog]);

  const markAsPaid = useCallback((id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, paid: true, paid_date: new Date().toISOString().split('T')[0], status: 'paid' as const } : i));
    addLog({ user_id: user?.id || 'usr_001', invoice_id: id, action_type: 'invoice_paid', description: `Invoice ${id} marked as paid` });
  }, [addLog, user]);

  const updateUser = useCallback((u: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...u } : prev);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      invoices,
      activityLogs,
      isProDemo,
      login, signup, logout,
      addInvoice, updateInvoice, markAsPaid,
      addLog, setProDemo: setIsProDemo, updateUser,
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
