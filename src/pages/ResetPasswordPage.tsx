import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateNewPassword } from '@/lib/passwordRules';

type Phase = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // The emailed link signs the user in with a short-lived recovery session.
  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session))) setPhase('ready');
    });
    supabase.auth.getSession().then(({ data }) => { if (active && data.session) setPhase('ready'); });
    const timer = setTimeout(() => { if (active) setPhase(p => (p === 'checking' ? 'invalid' : p)); }, 4000);
    return () => { active = false; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewPassword(password, confirm);
    if (problem) { setError(problem); return; }
    setError('');
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) { setError(updateError.message); return; }
    setPhase('done');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-foreground">ChaseFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
        </div>
        {phase === 'checking' && <div className="bg-card rounded-xl p-8 shadow-card text-center text-muted-foreground" role="status">Checking your link…</div>}
        {phase === 'invalid' && (
          <div className="bg-card rounded-xl p-8 shadow-card space-y-3 text-center">
            <p className="text-foreground">This reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="text-primary font-medium hover:underline text-sm">Request a new link</Link>
          </div>
        )}
        {phase === 'done' && <div className="bg-card rounded-xl p-8 shadow-card text-center text-foreground" role="status">Password updated. Taking you to your dashboard…</div>}
        {phase === 'ready' && (
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-8 shadow-card space-y-5">
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>{submitting ? 'Saving…' : 'Update password'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
