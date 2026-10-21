import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { resolveLogo, uploadLogo } from '@/lib/branding';
import { toast } from 'sonner';
export default function BrandingFields({ userId, companyName, onCompanyNameChange, logoPath, onLogoChange, onBusyChange }: {
  userId: string; companyName: string; onCompanyNameChange: (v: string) => void;
  logoPath: string | null; onLogoChange: (v: string | null) => void; onBusyChange?: (busy: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true; let objectUrl: string | null = null; setPreview(null);
    resolveLogo(logoPath).then(url => { objectUrl = url; if (live) setPreview(url); else if (url) URL.revokeObjectURL(url); }).catch(() => toast.error('Could not load your logo'));
    return () => { live = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [logoPath]);
  return <div className="space-y-4">
    <div className="space-y-1.5"><Label htmlFor="brand-name">Company / Brand Name</Label><Input id="brand-name" value={companyName} onChange={e => onCompanyNameChange(e.target.value)} placeholder="Your business name" /></div>
    <div className="space-y-1.5"><Label htmlFor="brand-logo">Invoice Logo / Image</Label><Input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e => {
      const file = e.target.files?.[0]; if (!file) return; setBusy(true); onBusyChange?.(true);
      try { onLogoChange(await uploadLogo(userId, file)); } catch (error) { toast.error(error instanceof Error ? error.message : 'Logo upload failed'); }
      finally { setBusy(false); onBusyChange?.(false); e.target.value = ''; }
    }} /><p className="text-xs text-muted-foreground">PNG, JPEG or WebP · up to 5 MB</p></div>
    {busy && <p role="status" className="text-sm text-muted-foreground">Uploading image…</p>}
    {preview && <div className="flex items-center gap-4"><img src={preview} alt="Your invoice logo" className="h-20 w-32 object-contain" /><Button variant="outline" size="sm" onClick={() => onLogoChange(null)} disabled={busy}>Remove image</Button></div>}
  </div>;
}