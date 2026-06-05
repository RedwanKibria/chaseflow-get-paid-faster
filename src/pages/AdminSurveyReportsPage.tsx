import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, FileSpreadsheet, Eye } from 'lucide-react';
import { downloadCsv, downloadExcel } from '@/lib/exportUtils';
import TablePagination from '@/components/TablePagination';

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
  answer_type: string;
}

interface DetailAnswer {
  survey_question_id: string;
  satisfaction_value: number | null;
  yes_no_value: boolean | null;
  comment_value: string | null;
}

export default function AdminSurveyReportsPage() {
  const { isAdmin } = useApp();
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewRow, setViewRow] = useState<SurveyRow | null>(null);
  const [detailAnswers, setDetailAnswers] = useState<DetailAnswer[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);


  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data }, { data: qs }] = await Promise.all([
        supabase.from('survey_reports_view').select('*').order('created_at', { ascending: false }),
        supabase.from('survey_questions').select('id, question_text, question_order, question_key, answer_type').eq('is_active', true).order('question_order'),
      ]);
      if (data) setRows(data as SurveyRow[]);
      if (qs) setQuestions(qs as SurveyQuestion[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleView = async (row: SurveyRow) => {
    setViewRow(row);
    if (row.submission_id) {
      setLoadingDetail(true);
      const { data } = await supabase
        .from('survey_answers')
        .select('survey_question_id, satisfaction_value, yes_no_value, comment_value')
        .eq('submission_id', row.submission_id);
      setDetailAnswers((data ?? []) as DetailAnswer[]);
      setLoadingDetail(false);
    }
  };

  const getDetailAnswer = (q: SurveyQuestion): string => {
    const a = detailAnswers.find(da => da.survey_question_id === q.id);
    if (!a) {
      if (q.question_key === 'q1_satisfaction') return viewRow?.q1_satisfaction !== null && viewRow?.q1_satisfaction !== undefined ? `${viewRow.q1_satisfaction} / 5` : 'Not answered';
      if (q.question_key === 'q2_satisfaction') return viewRow?.q2_satisfaction !== null && viewRow?.q2_satisfaction !== undefined ? `${viewRow.q2_satisfaction} / 5` : 'Not answered';
      if (q.question_key === 'q3_satisfaction') return viewRow?.q3_satisfaction !== null && viewRow?.q3_satisfaction !== undefined ? `${viewRow.q3_satisfaction} / 5` : 'Not answered';
      if (q.question_key === 'q4_pay_pro') return viewRow?.q4_pay_pro === null ? 'Not answered' : viewRow?.q4_pay_pro ? 'Yes' : 'No';
      if (q.question_key === 'q5_comment') return viewRow?.q5_comment || 'No comment';
      return 'Not answered';
    }
    if (q.answer_type === 'satisfaction_1_5') return a.satisfaction_value !== null ? `${a.satisfaction_value} / 5` : 'Not answered';
    if (q.answer_type === 'yes_no') return a.yes_no_value === null ? 'Not answered' : a.yes_no_value ? 'Yes' : 'No';
    if (q.answer_type === 'comment') return a.comment_value || 'No comment';
    return '—';
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      (r.full_name?.toLowerCase().includes(s)) ||
      (r.email?.toLowerCase().includes(s)) ||
      (r.company_name?.toLowerCase().includes(s))
    );
  }, [rows, search]);

  // Use full question text as column headers in export
  const exportData = useMemo(() => {
    return filtered.map(r => {
      const row: Record<string, any> = {
        'Name': r.full_name ?? '',
        'Email': r.email ?? '',
        'Company': r.company_name ?? '',
      };
      // Map question columns using full question text
      questions.forEach(q => {
        if (q.question_key === 'q1_satisfaction') row[q.question_text] = r.q1_satisfaction ?? '';
        else if (q.question_key === 'q2_satisfaction') row[q.question_text] = r.q2_satisfaction ?? '';
        else if (q.question_key === 'q3_satisfaction') row[q.question_text] = r.q3_satisfaction ?? '';
        else if (q.question_key === 'q4_pay_pro') row[q.question_text] = r.q4_pay_pro === null ? '' : r.q4_pay_pro ? 'Yes' : 'No';
        else if (q.question_key === 'q5_comment') row[q.question_text] = r.q5_comment ?? '';
      });
      row['Submitted'] = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '';
      return row;
    });
  }, [filtered, questions]);

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
            <Input placeholder="Search by name, email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—')}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleView(r)} className="h-7 text-xs">
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
          <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-3 border-b border-border shrink-0">
              <DialogTitle>Survey Response — {viewRow?.full_name || viewRow?.email || 'User'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {viewRow && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span> {viewRow.email || '—'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Submitted:</span>{' '}
                    {viewRow.submitted_at ? new Date(viewRow.submitted_at).toLocaleString() : '—'}
                  </div>
                  <div className="border-t border-border pt-4 space-y-4">
                    {loadingDetail ? (
                      <div className="text-center text-muted-foreground py-4">Loading answers...</div>
                    ) : (
                      questions.map((q, idx) => (
                        <div key={q.id} className="bg-muted/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-1">Q{idx + 1}. {q.question_text}</p>
                          <p className="text-sm text-muted-foreground">{getDetailAnswer(q)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
