import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' } as const;

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-muted-foreground', className)} role="status" aria-live="polite">
      <Loader2 className={cn(sizeMap[size], 'animate-spin text-primary')} />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-t border-border animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-3">
          <div className="h-3 rounded bg-muted/70 w-3/4" />
        </td>
      ))}
    </tr>
  );
}
