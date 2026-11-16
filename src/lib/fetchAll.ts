/**
 * Loads every row of a query by reading it in pages, so reports are not cut off
 * at the database's per-request row limit.
 *
 * `loadPage(from, to)` must return the rows between the two zero-based indexes
 * (inclusive), for example `query.range(from, to)`. Give the query a stable
 * order so pages do not overlap.
 */
export const PAGE_SIZE = 1000;
export const MAX_ROWS = 50000;

export async function fetchAllRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize: number = PAGE_SIZE,
  maxRows: number = MAX_ROWS,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await loadPage(from, from + pageSize - 1);
    if (error) throw error instanceof Error ? error : new Error(String((error as { message?: string })?.message ?? error));
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

/** Splits a list into smaller lists, so long `.in(...)` filters stay within URL limits. */
export function chunk<T>(items: T[], size: number = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
