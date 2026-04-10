import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  role: string;
  is_active: boolean;
}

interface Perms {
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

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_order: number;
}

interface SurveyQuestionPerm {
  id: string;
  survey_question_id: string;
  can_view: boolean;
}

const permKeys: { key: keyof Perms; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'create_invoice', label: 'Create Invoice' },
  { key: 'my_invoices', label: 'My Invoices' },
  { key: 'activity_logs', label: 'Activity Logs' },
  { key: 'pro_plan', label: 'Pro Plan' },
  { key: 'settings', label: 'Settings' },
  { key: 'review_feedback', label: 'Help ChaseFlow Improve' },
  { key: 'admin_user_management', label: 'Admin: User Management' },
  { key: 'admin_system_logs', label: 'Admin: System Logs' },
  { key: 'admin_invoice_reports', label: 'Admin: Invoice Reports' },
  { key: 'admin_survey_reports', label: 'Admin: Survey Reports' },
];

export default function AdminUserManagementPage() {
  const { isAdmin } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [perms, setPerms] = useState<Perms | null>(null);
  const [dirtyPerms, setDirtyPerms] = useState<Partial<Perms>>({});
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [surveyPerms, setSurveyPerms] = useState<SurveyQuestionPerm[]>([]);
  const [dirtySurveyPerms, setDirtySurveyPerms] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('users_profile').select('id, full_name, email, company_name');
    const { data: accesses } = await supabase.from('user_access').select('user_id, role, is_active');

    const accessMap = new Map((accesses ?? []).map(a => [a.user_id, a]));
    const rows: UserRow[] = (profiles ?? []).map(p => {
      const a = accessMap.get(p.id);
      return { id: p.id, full_name: p.full_name, email: p.email, company_name: p.company_name, role: a?.role ?? 'user', is_active: a?.is_active ?? true };
    });
    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    supabase.from('survey_questions').select('id, question_text, question_order').order('question_order').then(({ data }) => {
      if (data) setSurveyQuestions(data as SurveyQuestion[]);
    });
  }, []);

  const toggleActive = async (userId: string, active: boolean) => {
    await supabase.rpc('admin_set_user_active', { p_user_id: userId, p_is_active: active });
    fetchUsers();
  };

  const openPerms = async (u: UserRow) => {
    setEditUser(u);
    setDirtyPerms({});
    setDirtySurveyPerms({});
    const [{ data: pagePerms }, { data: sqPerms }] = await Promise.all([
      supabase.from('user_page_permissions').select('*').eq('user_id', u.id).single(),
      supabase.from('user_survey_question_permissions').select('*').eq('user_id', u.id),
    ]);
    if (pagePerms) setPerms(pagePerms as unknown as Perms);
    setSurveyPerms((sqPerms ?? []).map((p: any) => ({ id: p.id, survey_question_id: p.survey_question_id, can_view: p.can_view })));
  };

  const localTogglePerm = (key: keyof Perms, val: boolean) => {
    setDirtyPerms(prev => ({ ...prev, [key]: val }));
  };

  const localToggleSurveyPerm = (questionId: string, val: boolean) => {
    setDirtySurveyPerms(prev => ({ ...prev, [questionId]: val }));
  };

  const getPermValue = (key: keyof Perms): boolean => {
    if (key in dirtyPerms) return dirtyPerms[key]!;
    return perms ? perms[key] : true;
  };

  const getSurveyPermValue = (questionId: string): boolean => {
    if (questionId in dirtySurveyPerms) return dirtySurveyPerms[questionId];
    const perm = surveyPerms.find(p => p.survey_question_id === questionId);
    return perm?.can_view ?? true;
  };

  const hasDirtyChanges = Object.keys(dirtyPerms).length > 0 || Object.keys(dirtySurveyPerms).length > 0;

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      // Save page permissions
      for (const [key, val] of Object.entries(dirtyPerms)) {
        await supabase.rpc('admin_set_user_permission', { p_user_id: editUser.id, p_permission_key: key, p_enabled: val });
      }
      // Save survey question permissions
      for (const [questionId, val] of Object.entries(dirtySurveyPerms)) {
        const existing = surveyPerms.find(p => p.survey_question_id === questionId);
        if (existing) {
          await supabase.from('user_survey_question_permissions').update({ can_view: val } as any).eq('id', existing.id);
        }
      }
      // Apply dirty changes to local state
      setPerms(prev => prev ? { ...prev, ...dirtyPerms } : prev);
      setSurveyPerms(prev => prev.map(p => {
        if (p.survey_question_id in dirtySurveyPerms) {
          return { ...p, can_view: dirtySurveyPerms[p.survey_question_id] };
        }
        return p;
      }));
      setDirtyPerms({});
      setDirtySurveyPerms({});
      toast.success('Permissions saved successfully');
    } catch {
      toast.error('Failed to save permissions');
    }
    setSaving(false);
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-muted-foreground">Admin access required.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">User Management</h1>
        <p className="text-muted-foreground mb-8">Manage users, roles, and permissions</p>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Active</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-foreground font-medium">{u.full_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{u.email || '—'}</td>
                    <td className="p-3 text-muted-foreground">{u.company_name || '—'}</td>
                    <td className="p-3"><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></td>
                    <td className="p-3">
                      <Switch checked={u.is_active} onCheckedChange={v => toggleActive(u.id, v)} />
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openPerms(u)} className="h-7 text-xs">
                        Edit Permissions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="p-8 text-center text-muted-foreground">Loading...</div>}
        </div>

        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permissions — {editUser?.full_name || editUser?.email}</DialogTitle>
            </DialogHeader>
            {perms && (
              <div className="space-y-6 pt-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Page Permissions</h4>
                  <div className="space-y-3">
                    {permKeys.map(pk => (
                      <div key={pk.key} className="flex items-center justify-between">
                        <Label>{pk.label}</Label>
                        <Switch checked={getPermValue(pk.key)} onCheckedChange={v => localTogglePerm(pk.key, v)} />
                      </div>
                    ))}
                  </div>
                </div>

                {surveyQuestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Survey Question Permissions</h4>
                    <div className="space-y-4">
                      {surveyQuestions.map(sq => (
                        <div key={sq.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <p className="text-sm text-foreground font-medium">{sq.question_text}</p>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Can View</Label>
                            <Switch
                              checked={getSurveyPermValue(sq.id)}
                              onCheckedChange={v => localToggleSurveyPerm(sq.id, v)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-border">
                  <Button onClick={handleSave} disabled={!hasDirtyChanges || saving}>
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
