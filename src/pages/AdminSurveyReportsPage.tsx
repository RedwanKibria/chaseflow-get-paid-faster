import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, FileSpreadsheet, Eye } from 'lucide-react';
import { downloadCsv, downloadExcel } from '@/lib/exportUtils';

interface SurveyRow {
  submission_id: string | null;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  q1_satisfaction: number | null;
  q2_satisfaction: number | null;
  q3_satisfaction: number | null;
  q4_pay_pro: boolean | null;
  q5_comment: string | null;
  submitted_at: string | null;
  created_at: string | null;
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_order: number;
  question_key: string;
}

export default function AdminSurveyReportsPage() {
  const { isAdmin } = useApp();
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewRow, setViewRow] = useState<SurveyRow | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data }, { data: qs }] = await Promise.all([
        supabase.from('survey_reports_view').select('*').order('created_at', { ascending: false }),
        supabase.from('survey_questions').select('id, question_text, question_order, question_key').order('question_order'),
      ]);
      if (data) setRows(data as SurveyRow[]);
      if (qs) setQuestions(qs as SurveyQuestion[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      (r.full_name?.toLowerCase().includes(s)) ||
      (r.email?.toLowerCase().includes(s)) ||
      (r.company_name?.toLowerCase().includes(s))
    );
  }, [rows, search]);

  const exportData = useMemo(() => {
    return filtered.map(r => ({
      'Name': r.full_name ?? '',
      'Email': r.email ?? '',
      'Company': r.company_name ?? '',
      'Q1 Satisfaction': r.q1_satisfaction ?? '',
      'Q2 Satisfaction': r.q2_satisfaction ?? '',
      'Q3 Satisfaction': r.q3_satisfaction ?? '',
      'Would Pay Pro': r.q4_pay_pro === null ? '' : r.q4_pay_pro ? 'Yes' : 'No',
      'Comment': r.q5_comment ?? '',
      'Submitted': r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '',
    }));
  }, [filtered]);

  const getAnswerForQuestion = (row: SurveyRow, q: SurveyQuestion): string => {
    const key = q.question_key;
    if (key === 'q1_satisfaction') return row.q1_satisfaction !== null ? `${row.q1_satisfaction}/5` : 'Not answered';
    if (key === 'q2_satisfaction') return row.q2_satisfaction !== null ? `${row.q2_satisfaction}/5` : 'Not answered';
    if (key === 'q3_satisfaction') return row.q3_satisfaction !== null ? `${row.q3_satisfaction}/5` : 'Not answered';
    if (key === 'q4_pay_pro') return row.q4_pay_pro === null ? 'Not answered' : row.q4_pay_pro ? 'Yes' : 'No';
    if (key === 'q5_comment') return row.q5_comment || 'No comment';
    return '—';
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Survey Reports</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv(exportData, 'survey-report')} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExcel(exportData, 'survey-report')} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">View all user survey submissions</p>

        <div className="bg-card rounded-xl p-5 shadow-card mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Q1</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Q2</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Q3</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Pay Pro?</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Submitted</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.submission_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{r.full_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{r.email || '—'}</td>
                    <td className="p-3 text-muted-foreground">{r.company_name || '—'}</td>
                    <td className="p-3 text-center text-foreground">{r.q1_satisfaction ?? '—'}</td>
                    <td className="p-3 text-center text-foreground">{r.q2_satisfaction ?? '—'}</td>
                    <td className="p-3 text-center text-foreground">{r.q3_satisfaction ?? '—'}</td>
                    <td className="p-3 text-center">
                      {r.q4_pay_pro === null ? '—' : (
                        <Badge variant={r.q4_pay_pro ? 'default' : 'secondary'}>
                          {r.q4_pay_pro ? 'Yes' : 'No'}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—')}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setViewRow(r)} className="h-7 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="p-8 text-center text-muted-foreground">Loading...</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No survey submissions found.</div>
          )}
        </div>

        <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Survey Response — {viewRow?.full_name || viewRow?.email || 'User'}</DialogTitle>
            </DialogHeader>
            {viewRow && (
              <div className="space-y-4 pt-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span> {viewRow.email || '—'}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Submitted:</span>{' '}
                  {viewRow.submitted_at ? new Date(viewRow.submitted_at).toLocaleString() : '—'}
                </div>
                <div className="border-t border-border pt-4 space-y-4">
                  {questions.map(q => (
                    <div key={q.id} className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm font-medium text-foreground mb-1">Q{q.question_order}. {q.question_text}</p>
                      <p className="text-sm text-muted-foreground">{getAnswerForQuestion(viewRow, q)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
