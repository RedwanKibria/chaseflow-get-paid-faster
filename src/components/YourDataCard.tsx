import { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchAllRows } from '@/lib/fetchAll';
import { buildDataExport } from '@/lib/dataExport';
import { downloadJson } from '@/lib/exportUtils';

export default function YourDataCard() {
  const { user, logout } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const download = async () => {
    setDownloading(true);
    try {
      const [{ data: profile }, invoices, logs] = await Promise.all([
        supabase.from('users_profile').select('*').eq('id', user.id).single(),
        fetchAllRows<Record<string, unknown>>((from, to) =>
          supabase.from('invoices').select('*, items:invoice_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).order('id').range(from, to) as any,
        ),
        fetchAllRows<Record<string, unknown>>((from, to) =>
          supabase.from('activity_logs').select('*').eq('actor_user_id', user.id).order('created_at', { ascending: false }).order('id').range(from, to) as any,
        ),
      ]);
      downloadJson(buildDataExport({ profile: profile as Record<string, unknown> | null, invoices, activityLogs: logs }), 'chaseflow-my-data');
      toast.success('Your data has been downloaded');
    } catch {
      toast.error('Could not download your data. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const requestDeletion = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke('request-account-deletion', { body: { confirm: 'DELETE' } });
    setDeleting(false);
    if (error || (data as { error?: string } | null)?.error) {
      toast.error('Could not submit your request', { description: String(error?.message ?? (data as { error?: string })?.error ?? 'Unknown error') });
      return;
    }
    toast.success('Deletion requested. You have been signed out.');
    setConfirmOpen(false);
    logout();
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
      <h3 className="font-semibold text-foreground">Your data</h3>
      <p className="text-sm text-muted-foreground">Download a copy of your profile, invoices and activity, or ask us to delete your account.</p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={download} disabled={downloading}>{downloading ? 'Preparing…' : 'Download my data'}</Button>
        <Button type="button" variant="outline" className="text-destructive" onClick={() => { setTyped(''); setConfirmOpen(true); }}>Request account deletion</Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request account deletion</DialogTitle>
            <DialogDescription>
              Your account is switched off straight away, your invoices are hidden and pending reminders are cancelled. We then remove your data. Download a copy first if you want one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input id="delete-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={requestDeletion} disabled={typed !== 'DELETE' || deleting}>{deleting ? 'Submitting…' : 'Request deletion'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
