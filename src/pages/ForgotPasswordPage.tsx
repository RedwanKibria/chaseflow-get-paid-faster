import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // The same message is shown whether or not the address has an account, so the form
    // cannot be used to find out who is registered.
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` }).catch(() => undefined);
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-foreground">ChaseFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted-foreground mt-1">We will email you a link to choose a new one</p>
        </div>
        {sent ? (
          <div className="bg-card rounded-xl p-8 shadow-card space-y-4 text-center" role="status">
            <p className="text-foreground">If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.</p>
            <Link to="/login" className="text-primary font-medium hover:underline text-sm">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-8 shadow-card space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full h-11" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary font-medium hover:underline">Back to log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
