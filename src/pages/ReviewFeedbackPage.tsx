import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, CheckCircle2 } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  question_key: string;
  question_text: string;
  answer_type: string;
  question_order: number;
}

function RatingInput({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-colors"
        >
          <Star
            className={`h-7 w-7 ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
          />
        </button>
      ))}
    </div>
  );
}

function YesNoInput({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
            value === v
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-input hover:bg-muted'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

export default function ReviewFeedbackPage() {
  const { user } = useApp();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [q1, setQ1] = useState(0);
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState<boolean | null>(null);
  const [q5, setQ5] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('survey_questions')
      .select('*')
      .eq('is_active', true)
      .order('question_order')
      .then(({ data }) => {
        if (data) setQuestions(data as SurveyQuestion[]);
      });
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    await supabase.from('survey_submissions').insert({
      user_id: user.id,
      q1_satisfaction: q1 || null,
      q2_satisfaction: q2 || null,
      q3_satisfaction: q3 || null,
      q4_pay_pro: q4,
      q5_comment: q5 || null,
    });
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

  const qMap: Record<string, React.ReactNode> = {};
  questions.forEach(q => {
    if (q.question_key === 'q1_satisfaction' || q.answer_type === 'rating' && q.question_order === 1) {
      qMap[q.id] = <RatingInput value={q1} onChange={setQ1} />;
    } else if (q.question_key === 'q2_satisfaction' || q.answer_type === 'rating' && q.question_order === 2) {
      qMap[q.id] = <RatingInput value={q2} onChange={setQ2} />;
    } else if (q.question_key === 'q3_satisfaction' || q.answer_type === 'rating' && q.question_order === 3) {
      qMap[q.id] = <RatingInput value={q3} onChange={setQ3} />;
    } else if (q.question_key === 'q4_pay_pro' || q.answer_type === 'boolean') {
      qMap[q.id] = <YesNoInput value={q4} onChange={setQ4} />;
    } else if (q.question_key === 'q5_comment' || q.answer_type === 'text') {
      qMap[q.id] = (
        <Textarea
          value={q5}
          onChange={e => setQ5(e.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
        />
      );
    }
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Review & Feedback</h1>
        <p className="text-muted-foreground mb-8">Help us improve ChaseFlow by sharing your experience</p>

        <div className="space-y-6">
          {questions.map(q => (
            <div key={q.id} className="bg-card rounded-xl p-6 shadow-card">
              <Label className="text-base font-medium text-foreground mb-3 block">{q.question_text}</Label>
              {qMap[q.id] ?? <p className="text-sm text-muted-foreground">Unsupported question type</p>}
            </div>
          ))}
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
