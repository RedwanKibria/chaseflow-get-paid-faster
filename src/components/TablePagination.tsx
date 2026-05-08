import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  pageSizeOptions?: number[];
}

export default function TablePagination({
  page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}-{end}</span> of <span className="font-medium text-foreground">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
        <Button variant="outline" size="sm" className="h-8 px-2" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[70px] text-center">
          Page <span className="font-medium text-foreground">{safePage}</span> / {totalPages}
        </span>
        <Button variant="outline" size="sm" className="h-8 px-2" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
