import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  plan: string;
  status: string;
  renews_at: string | null;
}

const CURRENCIES = [
  { code: 'GBP', label: '£ (GBP) — British Pound' },
  { code: 'USD', label: '$ (USD) — US Dollar' },
  { code: 'EUR', label: '€ (EUR) — Euro' },
  { code: 'INR', label: '₹ (INR) — Indian Rupee' },
  { code: 'AUD', label: 'A$ (AUD) — Australian Dollar' },
  { code: 'CAD', label: 'C$ (CAD) — Canadian Dollar' },
  { code: 'JPY', label: '¥ (JPY) — Japanese Yen' },
  { code: 'CNY', label: '¥ (CNY) — Chinese Yuan' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'SGD', label: 'S$ (SGD) — Singapore Dollar' },
  { code: 'HKD', label: 'HK$ (HKD) — Hong Kong Dollar' },
  { code: 'NZD', label: 'NZ$ (NZD) — New Zealand Dollar' },
  { code: 'SEK', label: 'kr (SEK) — Swedish Krona' },
  { code: 'NOK', label: 'kr (NOK) — Norwegian Krone' },
  { code: 'DKK', label: 'kr (DKK) — Danish Krone' },
  { code: 'KRW', label: '₩ (KRW) — South Korean Won' },
  { code: 'BRL', label: 'R$ (BRL) — Brazilian Real' },
  { code: 'ZAR', label: 'R (ZAR) — South African Rand' },
  { code: 'MXN', label: 'MX$ (MXN) — Mexican Peso' },
  { code: 'TRY', label: '₺ (TRY) — Turkish Lira' },
  { code: 'PLN', label: 'zł (PLN) — Polish Zloty' },
  { code: 'THB', label: '฿ (THB) — Thai Baht' },
  { code: 'MYR', label: 'RM (MYR) — Malaysian Ringgit' },
  { code: 'IDR', label: 'Rp (IDR) — Indonesian Rupiah' },
  { code: 'PHP', label: '₱ (PHP) — Philippine Peso' },
  { code: 'VND', label: '₫ (VND) — Vietnamese Dong' },
  { code: 'BDT', label: '৳ (BDT) — Bangladeshi Taka' },
  { code: 'PKR', label: '₨ (PKR) — Pakistani Rupee' },
  { code: 'EGP', label: 'E£ (EGP) — Egyptian Pound' },
  { code: 'NGN', label: '₦ (NGN) — Nigerian Naira' },
  { code: 'KES', label: 'KSh (KES) — Kenyan Shilling' },
  { code: 'GHS', label: 'GH₵ (GHS) — Ghanaian Cedi' },
  { code: 'AED', label: 'د.إ (AED) — UAE Dirham' },
  { code: 'SAR', label: '﷼ (SAR) — Saudi Riyal' },
  { code: 'QAR', label: 'QR (QAR) — Qatari Riyal' },
  { code: 'KWD', label: 'KD (KWD) — Kuwaiti Dinar' },
  { code: 'BHD', label: 'BD (BHD) — Bahraini Dinar' },
  { code: 'OMR', label: 'OMR — Omani Rial' },
  { code: 'JOD', label: 'JD (JOD) — Jordanian Dinar' },
  { code: 'ILS', label: '₪ (ILS) — Israeli Shekel' },
  { code: 'CZK', label: 'Kč (CZK) — Czech Koruna' },
  { code: 'HUF', label: 'Ft (HUF) — Hungarian Forint' },
  { code: 'RON', label: 'lei (RON) — Romanian Leu' },
  { code: 'UAH', label: '₴ (UAH) — Ukrainian Hryvnia' },
  { code: 'RUB', label: '₽ (RUB) — Russian Ruble' },
  { code: 'TWD', label: 'NT$ (TWD) — Taiwan Dollar' },
  { code: 'CLP', label: 'CL$ (CLP) — Chilean Peso' },
  { code: 'COP', label: 'COL$ (COP) — Colombian Peso' },
  { code: 'PEN', label: 'S/. (PEN) — Peruvian Sol' },
  { code: 'ARS', label: 'AR$ (ARS) — Argentine Peso' },
];

export default function SettingsPage() {
  const { user, updateUser } = useApp();
  const [name, setName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [currency, setCurrency] = useState((user as any)?.currency || 'GBP');
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscriptions')
      .select('plan, status, renews_at')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setSubscription(data as Subscription);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    // Fetch currency from profile
    supabase.from('users_profile').select('currency').eq('id', user.id).single().then(({ data }) => {
      if (data && (data as any).currency) setCurrency((data as any).currency);
    });
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setCompanyName(user.company_name || '');
    }
  }, [user]);

  const handleSave = async () => {
    // Call the updated RPC with currency
    if (!user) return;
    await supabase.rpc('update_my_profile', {
      p_full_name: name,
      p_company_name: companyName,
      p_currency: currency,
    });
    // Update local state
    updateUser({ full_name: name, company_name: companyName, currency } as any);
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
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Currency</h3>
            <p className="text-sm text-muted-foreground">Select your preferred currency for invoices.</p>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
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

          <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Plan & Billing</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Current Plan:</span>
                <Badge variant={subscription?.plan === 'pro' ? 'default' : 'secondary'}>
                  {subscription?.plan === 'pro' ? 'Pro' : 'Free'}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={subscription?.status === 'active' ? 'default' : 'outline'}>
                  {subscription?.status || 'inactive'}
                </Badge>
              </div>
              {subscription?.renews_at && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Renews:</span>
                  <span className="text-sm text-foreground">{new Date(subscription.renews_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
