import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { buildChecklist, checklistComplete } from '@/lib/onboardingChecklist';

const KEY = 'chaseflow-first-run-dismissed';

function wasDismissed(userId: string): boolean {
  try { return localStorage.getItem(`${KEY}:${userId}`) === '1'; } catch { return false; }
}

export default function FirstRunChecklist() {
  const { user, invoices } = useApp();
  const [hidden, setHidden] = useState(() => (user ? wasDismissed(user.id) : false));
  if (!user || hidden) return null;

  const active = invoices.filter(i => !i.is_deleted);
  const items = buildChecklist({
    hasBranding: !!(user.logo_path || (user.company_name ?? '').trim()),
    invoiceCount: active.length,
    anySent: active.some(i => i.before_3_sent || i.due_sent || i.after_3_sent || i.after_7_sent || i.after_14_sent),
  });
  if (checklistComplete(items)) return null;

  const dismiss = () => {
    try { localStorage.setItem(`${KEY}:${user.id}`, '1'); } catch { /* storage unavailable */ }
    setHidden(true);
  };

  return (
    <section aria-label="Getting started" className="bg-card rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="font-semibold text-foreground">Get started</h2>
          <p className="text-sm text-muted-foreground">Three steps to your first automatic reminder.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Hide getting started" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.key} className="flex items-start gap-3">
            {i.done ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" aria-label="Done" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5" aria-label="Not done" />}
            <div className="min-w-0">
              {i.done ? <span className="text-sm text-muted-foreground line-through">{i.label}</span> : <Link to={i.to} className="text-sm font-medium text-primary hover:underline">{i.label}</Link>}
              {!i.done && <p className="text-xs text-muted-foreground">{i.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
