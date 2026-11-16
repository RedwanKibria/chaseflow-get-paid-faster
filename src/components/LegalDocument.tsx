import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { hasPlaceholders } from '@/config/legal';

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export default function LegalDocument({ title, intro, sections }: { title: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground"><Zap className="h-5 w-5 text-primary" /> ChaseFlow</Link>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/login" className="hover:text-foreground">Log in</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10 max-w-3xl">
        {hasPlaceholders() && (
          <div role="alert" className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
            This page still contains placeholder details and has not been finalised. Complete <code>src/config/legal.ts</code> and have the text reviewed before launch.
          </div>
        )}
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">{intro}</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-foreground mb-2">{i + 1}. {s.title}</h2>
              {s.paragraphs?.map(p => <p key={p} className="text-sm leading-relaxed text-muted-foreground mb-2">{p}</p>)}
              {s.bullets && (
                <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {s.bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
