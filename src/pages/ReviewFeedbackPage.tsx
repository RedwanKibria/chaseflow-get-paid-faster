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

interface QuestionPermission {
  survey_question_id: string;
  can_view: boolean;
  can_answer: boolean;
}

export default function ReviewFeedbackPage() {
  const { user } = useApp();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [questionPerms, setQuestionPerms] = useState<Map<string, QuestionPermission>>(new Map());
  const [answers, setAnswers] = useState<Record<string, { satisfaction_value?: number; yes_no_value?: boolean; comment_value?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('survey_questions').select('*').eq('is_active', true).order('question_order'),
      supabase.from('user_survey_question_permissions').select('*').eq('user_id', user.id),
    ]).then(([{ data: qs }, { data: perms }]) => {
      const permMap = new Map<string, QuestionPermission>();
      (perms ?? []).forEach((p: any) => permMap.set(p.survey_question_id, p));
      setQuestionPerms(permMap);

      const viewable = (qs ?? []).filter((q: any) => {
        const perm = permMap.get(q.id);
        return perm ? perm.can_view : true;
      });
      setQuestions(viewable as SurveyQuestion[]);
    });
  }, [user]);

  const canAnswer = (questionId: string) => {
    const perm = questionPerms.get(questionId);
    return perm ? perm.can_answer : true;
  };

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
      .filter(q => canAnswer(q.id) && answers[q.id])
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

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Thank you for your feedback!</h2>
          <p className="text-muted-foreground">Your responses have been recorded.</p>
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
            const disabled = !canAnswer(q.id);
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
                        disabled={disabled}
                        onClick={() => setAnswer(q.id, 'satisfaction_value', n)}
                        className={`h-10 w-10 rounded-lg text-sm font-semibold border transition-colors ${
                          answer.satisfaction_value === n
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={disabled}
                        onClick={() => setAnswer(q.id, 'yes_no_value', opt.value)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          answer.yes_no_value === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-input hover:bg-muted'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    disabled={disabled}
                  />
                )}

                {disabled && (
                  <p className="text-xs text-muted-foreground mt-2">You do not have permission to answer this question.</p>
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
