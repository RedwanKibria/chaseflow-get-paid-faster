import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BrandingFields from './BrandingFields';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
export default function BrandingOnboarding() {
  const { user, updateUser } = useApp();
  const [name, setName] = useState(user?.company_name ?? '');
  const [logo, setLogo] = useState<string | null>(user?.logo_path ?? null);
  const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  if (!user || user.branding_onboarded) return null;
  const save = async (skip: boolean) => {
    setBusy(true);
    try {
      await updateUser({ ...(skip ? {} : { company_name: name, logo_path: logo }), branding_onboarded: true });
      // First login finished: send the welcome email once. This dialog never shows again
      // after branding_onboarded is saved, so the email is not repeated. Failure is not shown.
      supabase.functions
        .invoke('send-welcome-email', { body: { full_name: user.full_name } })
        .catch(e => console.warn('welcome email failed', e));
    }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save branding'); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={() => {}}><DialogContent className="max-h-[90dvh] overflow-y-auto [&>button]:hidden" onEscapeKeyDown={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
    <DialogHeader><DialogTitle>Make your invoices yours</DialogTitle><DialogDescription>Add your company name and logo now, or update them later in Settings.</DialogDescription></DialogHeader>
    <BrandingFields userId={user.id} companyName={name} onCompanyNameChange={setName} logoPath={logo} onLogoChange={setLogo} onBusyChange={setUploading} />
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy || uploading} onClick={() => save(true)}>Skip</Button><Button disabled={busy || uploading} onClick={() => save(false)}>{busy ? 'Saving…' : 'Save & Continue'}</Button></div>
  </DialogContent></Dialog>;
}