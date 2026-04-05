import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user, updateUser } = useApp();
  const [name, setName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser({ full_name: name, company_name: companyName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

        {saved && (
          <div className="mb-6 p-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium">
            ✓ Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your Company Ltd" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Default Reminder Preferences</h3>
            <div className="space-y-3">
              {['3 days before due date', 'On due date', '3 days after due date', '7 days after due date', '14 days after due date'].map((label, i) => (
                <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox defaultChecked={i < 2} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card space-y-3">
            <h3 className="font-semibold text-foreground">Plan & Billing</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <Badge variant="secondary">{user?.plan === 'pro' ? 'Pro' : 'Free'}</Badge>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
