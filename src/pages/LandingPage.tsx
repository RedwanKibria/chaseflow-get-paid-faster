import { Link } from 'react-router-dom';
import { Zap, FileText, Bell, BarChart3, Shield, Clock, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: FileText, title: 'Professional Invoices', desc: 'Create polished invoices in seconds with regular or hourly billing.' },
  { icon: Bell, title: 'Automated Reminders', desc: 'Set smart reminders before and after due dates — never chase again.' },
  { icon: BarChart3, title: 'Real-Time Dashboard', desc: 'Track outstanding, overdue, and paid invoices at a glance.' },
  { icon: Shield, title: 'Activity Logging', desc: 'Every action tracked — full audit trail for your peace of mind.' },
];

const faqs = [
  { q: 'Is ChaseFlow free to use?', a: 'Yes! Our Free plan includes up to 10 invoices per month with core features. Upgrade to Pro for unlimited invoices and advanced automation.' },
  { q: 'Can I customise reminder emails?', a: 'Absolutely. You can edit reminder templates and choose exactly when reminders are sent — before, on, or after the due date.' },
  { q: 'Does ChaseFlow support hourly billing?', a: 'Yes. Create invoices with hourly rates and tracked hours, perfect for consultants and freelancers.' },
  { q: 'How does the Pro plan work?', a: 'Pro unlocks unlimited invoices, branded templates, bulk actions, and advanced analytics. You can try Pro features in demo mode before upgrading.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">ChaseFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" /> Invoicing made effortless
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Stop chasing invoices.<br />Get paid faster — <span className="text-primary">automatically.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            ChaseFlow helps freelancers, consultants, and small businesses create professional invoices, 
            track payment statuses, and send automated reminders — so you can focus on the work that matters.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/signup"><Button size="lg" className="h-12 px-8 text-base">Start Free <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
            <Link to="/login"><Button variant="outline" size="lg" className="h-12 px-8 text-base">Log In</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface" id="features">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">Everything you need to get paid on time</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Powerful features wrapped in a simple, elegant interface.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20" id="pricing">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">Simple, transparent pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-card rounded-xl p-8 shadow-card border border-border">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <p className="text-4xl font-bold text-foreground mt-2">£0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-6 space-y-3">
                {['Up to 10 invoices/month', 'Basic reminders', 'Dashboard overview', 'Activity logs'].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-success" />{t}</li>
                ))}
              </ul>
              <Link to="/signup"><Button variant="outline" className="w-full mt-8">Get Started</Button></Link>
            </div>
            <div className="bg-card rounded-xl p-8 shadow-card border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">Popular</div>
              <h3 className="text-lg font-semibold text-foreground">Pro</h3>
              <p className="text-4xl font-bold text-foreground mt-2">£19<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="mt-6 space-y-3">
                {['Unlimited invoices', 'Advanced reminders', 'Branded templates', 'Bulk actions', 'Priority support', 'Analytics dashboard'].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary" />{t}</li>
                ))}
              </ul>
              <Link to="/signup"><Button className="w-full mt-8">Upgrade to Pro</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Built for people who do great work</h2>
          <p className="text-muted-foreground text-lg">
            ChaseFlow was created by freelancers who got tired of awkward payment follow-ups. 
            We believe your energy should go into your craft — not chasing invoices. 
            Our platform automates the uncomfortable parts of getting paid, so every project ends on a positive note.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" id="faq">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map((f, i) => (
              <div key={i} className="bg-card rounded-xl p-6 shadow-card">
                <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to get paid faster?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">Join thousands of freelancers and small businesses who've streamlined their invoicing.</p>
          <Link to="/signup"><Button size="lg" variant="secondary" className="h-12 px-8">Start Free Today</Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" /> ChaseFlow © 2026
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Privacy</span><span>Terms</span><span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
