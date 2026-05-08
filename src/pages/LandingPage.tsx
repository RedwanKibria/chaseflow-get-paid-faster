import { Link } from 'react-router-dom';
import { Zap, FileText, Bell, BarChart3, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: FileText, title: 'Professional Invoices', desc: 'Create polished invoices in seconds with regular or hourly billing.' },
  { icon: Bell, title: 'Automated Reminders', desc: 'Set smart reminders before and after due dates — never chase again.' },
  { icon: BarChart3, title: 'Real-Time Dashboard', desc: 'Track outstanding, overdue, and paid invoices at a glance.' },
  { icon: Shield, title: 'Activity Logging', desc: 'Every action tracked — full audit trail for your peace of mind.' },
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
