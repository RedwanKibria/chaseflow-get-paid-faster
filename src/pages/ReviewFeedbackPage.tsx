import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  question_key: string;
  question_text: string;
  answer_type: string;
  question_order: number;
}

interface SavedAnswer {
  survey_question_id: string;
  satisfaction_value: number | null;
  yes_no_value: boolean | null;
  comment_value: string | null;
}

export default function ReviewFeedbackPage() {
  const { user } = useApp();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, { satisfaction_value?: number; yes_no_value?: boolean; comment_value?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Check if user already submitted
      const { data: existingSub } = await supabase
        .from('survey_submissions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const [{ data: qs }] = await Promise.all([
        supabase.from('survey_questions').select('*').eq('is_active', true).order('question_order'),
      ]);

      setQuestions((qs ?? []) as SurveyQuestion[]);

      if (existingSub && existingSub.length > 0) {
        // Already submitted — fetch their answers
        const { data: ans } = await supabase
          .from('survey_answers')
          .select('survey_question_id, satisfaction_value, yes_no_value, comment_value')
          .eq('submission_id', existingSub[0].id);
        setSavedAnswers((ans ?? []) as SavedAnswer[]);
        setSubmitted(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const setAnswer = (questionId: string, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data: submission, error: subError } = await supabase
      .from('survey_submissions')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (subError || !submission) {
      setSubmitting(false);
      return;
    }

    const answerRows = questions
      .filter(q => answers[q.id])
      .map(q => ({
        submission_id: submission.id,
        user_id: user.id,
        survey_question_id: q.id,
        satisfaction_value: answers[q.id]?.satisfaction_value ?? null,
        yes_no_value: answers[q.id]?.yes_no_value ?? null,
        comment_value: answers[q.id]?.comment_value ?? null,
      }));

    if (answerRows.length > 0) {
      await supabase.from('survey_answers').insert(answerRows);
    }

    // Set saved answers for display
    setSavedAnswers(answerRows.map(r => ({
      survey_question_id: r.survey_question_id,
      satisfaction_value: r.satisfaction_value,
      yes_no_value: r.yes_no_value,
      comment_value: r.comment_value,
    })));

    setSubmitting(false);
    setSubmitted(true);
  };

  const getAnswerDisplay = (q: SurveyQuestion): string => {
    const a = savedAnswers.find(sa => sa.survey_question_id === q.id);
    if (!a) return 'Not answered';
    if (q.answer_type === 'satisfaction_1_5') return a.satisfaction_value !== null ? `${a.satisfaction_value} / 5` : 'Not answered';
    if (q.answer_type === 'yes_no') return a.yes_no_value === null ? 'Not answered' : a.yes_no_value ? 'Yes' : 'No';
    if (q.answer_type === 'comment') return a.comment_value || 'No comment';
    return '—';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Thank you {user?.full_name || ''} for your important feedback!
            </h2>
            <p className="text-muted-foreground">Your responses have been recorded. Here's what you submitted:</p>
          </div>

          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="bg-card rounded-xl p-5 shadow-card">
                <p className="text-sm font-medium text-foreground mb-2">Q{q.question_order}. {q.question_text}</p>
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  {getAnswerDisplay(q)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Help ChaseFlow Improve</h1>
        <p className="text-muted-foreground mb-8">Your feedback helps us build a better product</p>

        <div className="space-y-6">
          {questions.map(q => {
            const answer = answers[q.id] ?? {};

            return (
              <div key={q.id} className="bg-card rounded-xl p-6 shadow-card">
                <Label className="text-base font-medium text-foreground mb-4 block">{q.question_text}</Label>

                {q.answer_type === 'satisfaction_1_5' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswer(q.id, 'satisfaction_value', n)}
                        className={`h-10 w-10 rounded-lg text-sm font-semibold border transition-colors ${
                          answer.satisfaction_value === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {q.answer_type === 'yes_no' && (
                  <div className="flex gap-3">
                    {[
                      { label: 'Yes', value: true },
                      { label: 'No', value: false },
                    ].map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAnswer(q.id, 'yes_no_value', opt.value)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          answer.yes_no_value === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.answer_type === 'comment' && (
                  <Textarea
                    value={answer.comment_value ?? ''}
                    onChange={e => setAnswer(q.id, 'comment_value', e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                  />
                )}
              </div>
            );
          })}
        </div>

        {questions.length > 0 && (
          <div className="mt-8">
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
