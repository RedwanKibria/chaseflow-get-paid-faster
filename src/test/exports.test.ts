import { describe, expect, it } from 'vitest';
import { buildCsv, sanitizeCell } from '@/lib/exportUtils';
import { fetchAllRows, chunk } from '@/lib/fetchAll';

describe('export safety', () => {
  it('prefixes text that a spreadsheet would run as a formula', () => {
    for (const bad of ['=SUM(A1:A9)', '+44 20 7946 0000', '-2+3', '@cmd', '\tcmd']) {
      expect(sanitizeCell(bad).startsWith("'")).toBe(true);
    }
  });
  it('leaves normal text and real numbers unchanged', () => {
    expect(sanitizeCell('Acme Ltd')).toBe('Acme Ltd');
    expect(sanitizeCell(-12.5)).toBe('-12.5');
    expect(sanitizeCell(null)).toBe('');
    expect(sanitizeCell(undefined)).toBe('');
  });
  it('quotes commas, quotes and line breaks, and keeps column headers as written', () => {
    const csv = buildCsv([{ '-3 Days Mail': 'Sent', Client: 'Smith, "Bob"', Note: '=1+1' }]);
    const [header, row] = csv.split('\n');
    expect(header).toBe('-3 Days Mail,Client,Note');
    expect(row).toBe(`Sent,"Smith, ""Bob""",'=1+1`);
  });
});

describe('fetchAllRows', () => {
  const makeSource = (total: number) => (from: number, to: number) =>
    Promise.resolve({
      data: Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i),
      error: null,
    });

  it('reads every page, not just the first', async () => {
    const rows = await fetchAllRows<number>(makeSource(2503), 1000);
    expect(rows).toHaveLength(2503);
    expect(rows[0]).toBe(0);
    expect(rows[2502]).toBe(2502);
  });
  it('stops after one request when everything fits in one page', async () => {
    let calls = 0;
    const source = (from: number, to: number) => { calls += 1; return makeSource(10)(from, to); };
    expect(await fetchAllRows<number>(source, 1000)).toHaveLength(10);
    expect(calls).toBe(1);
  });
  it('handles an exact multiple of the page size and an empty result', async () => {
    expect(await fetchAllRows<number>(makeSource(2000), 1000)).toHaveLength(2000);
    expect(await fetchAllRows<number>(makeSource(0), 1000)).toEqual([]);
  });
  it('stops at the safety limit', async () => {
    expect(await fetchAllRows<number>(makeSource(10000), 1000, 3000)).toHaveLength(3000);
  });
  it('passes database errors on instead of returning partial data', async () => {
    await expect(fetchAllRows<number>(() => Promise.resolve({ data: null, error: { message: 'boom' } }))).rejects.toThrow('boom');
  });
});

describe('chunk', () => {
  it('splits long lists into pieces', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 100)).toEqual([]);
  });
});
