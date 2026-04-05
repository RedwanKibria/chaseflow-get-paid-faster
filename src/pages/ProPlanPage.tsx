import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Zap, Upload, FileText, BarChart3, Bell, Palette, Move, Image } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const freeFeatures = ['Up to 10 invoices/month', 'Basic reminders', 'Dashboard', 'Activity logs'];
const proFeatures = ['Unlimited invoices', 'Advanced dashboard', 'Automated reminder timeline', 'Editable email templates', 'Bulk invoice actions', 'Logo upload & branding'];

export default function ProPlanPage() {
  const { isProDemo, setProDemo, addLog } = useApp();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState([100]);
  const [logoX, setLogoX] = useState([50]);
  const [logoY, setLogoY] = useState([10]);

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const enterProDemo = () => {
    setProDemo(true);
    addLog({ action_type: 'pro_demo_entered', description: 'User entered Pro plan demo mode' });
  };

  const handleUpgradeClick = () => {
    addLog({ action_type: 'upgrade_clicked', description: 'User clicked Upgrade to Pro' });
    enterProDemo();
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Pro Plan</h1>
            <p className="text-muted-foreground">Unlock powerful features for your business</p>
          </div>
          <Badge variant={isProDemo ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {isProDemo ? '✨ Pro Demo Active' : 'Free Plan'}
          </Badge>
        </div>

        {!isProDemo && (
          <div className="gradient-hero rounded-xl p-8 mb-8 text-center">
            <Crown className="h-12 w-12 text-primary-foreground mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold text-primary-foreground mb-2">Upgrade to Pro</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Get unlimited invoices, branded templates, and automated reminders for £19/month.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="lg" onClick={handleUpgradeClick}>Upgrade Now — £19/mo</Button>
              <Button variant="ghost" size="lg" onClick={enterProDemo} className="text-primary-foreground border-primary-foreground/30 border hover:bg-primary-foreground/10">
                Try Demo
              </Button>
            </div>
          </div>
        )}

        {isProDemo && (
          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Unlimited Invoices</h3>
                <p className="text-sm text-muted-foreground mb-3">Create as many invoices as you need — no monthly limits.</p>
                <div className="text-2xl font-bold text-primary">∞</div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Advanced Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-3">Revenue trends, client analytics, and payment forecasting.</p>
                <div className="h-16 bg-muted rounded-lg flex items-end px-2 pb-1 gap-1">
                  {[40, 60, 35, 80, 55, 70, 90, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Reminder Timeline</h3>
                <p className="text-sm text-muted-foreground mb-3">Visualise your automated reminder schedule.</p>
                <div className="flex items-center gap-1">
                  {['-3d', 'Due', '+3d', '+7d', '+14d'].map((label, i) => (
                    <div key={i} className="flex-1 text-center">
                      <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${i <= 2 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Branding & Logo Preview</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload your logo</span>
                      <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                    </label>
                  </div>
                  {!logoPreview && (
                    <div className="flex gap-2">
                      {['🏢', '⚡', '🎯', '💼'].map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setLogoPreview(`emoji:${emoji}`)}
                          className="h-12 w-12 rounded-lg border border-border hover:border-primary flex items-center justify-center text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  {logoPreview && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Image className="h-4 w-4" /> Scale
                      </div>
                      <Slider value={logoScale} onValueChange={setLogoScale} min={30} max={200} step={5} />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Move className="h-4 w-4" /> Position X
                      </div>
                      <Slider value={logoX} onValueChange={setLogoX} min={0} max={100} step={1} />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Move className="h-4 w-4" /> Position Y
                      </div>
                      <Slider value={logoY} onValueChange={setLogoY} min={0} max={50} step={1} />
                      <Button variant="outline" size="sm" onClick={() => setLogoPreview(null)}>Remove Logo</Button>
                    </div>
                  )}
                </div>
                <div className="bg-surface rounded-lg p-6 border border-border relative overflow-hidden">
                  {logoPreview && (
                    <div
                      className="absolute"
                      style={{
                        left: `${logoX[0]}%`,
                        top: `${logoY[0]}%`,
                        transform: `translate(-50%, 0) scale(${logoScale[0] / 100})`,
                      }}
                    >
                      {logoPreview.startsWith('emoji:') ? (
                        <span className="text-4xl">{logoPreview.replace('emoji:', '')}</span>
                      ) : (
                        <img src={logoPreview} alt="Logo" className="h-12 w-auto object-contain" />
                      )}
                    </div>
                  )}
                  <div className="mt-16">
                    <h4 className="font-bold text-foreground text-lg">INVOICE</h4>
                    <p className="text-xs text-muted-foreground mb-3">INV-PRO-001</p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Bill To: Demo Client</p>
                      <p>Amount: £2,500.00</p>
                      <p>Due: {new Date(Date.now() + 14 * 86400000).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                      Thank you for your business!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={() => setProDemo(false)} className="mt-2">Exit Demo Mode</Button>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Free vs Pro Comparison</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Feature</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Free</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Monthly invoices', '10', 'Unlimited'],
                ['Reminders', 'Basic', 'Advanced + Timeline'],
                ['Dashboard', 'Standard', 'Advanced analytics'],
                ['Email templates', 'Default', 'Fully customisable'],
                ['Bulk actions', '—', '✓'],
                ['Branding / Logo', '—', '✓'],
                ['Priority support', '—', '✓'],
              ].map(([feature, free, pro], i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">{feature}</td>
                  <td className="p-3 text-center text-muted-foreground">{free}</td>
                  <td className="p-3 text-center font-medium text-primary">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
