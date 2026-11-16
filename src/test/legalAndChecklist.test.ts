import { describe, expect, it } from 'vitest';
import { buildChecklist, checklistComplete } from '@/lib/onboardingChecklist';
import { hasPlaceholders, LEGAL } from '@/config/legal';
import { formatAmount } from '@/lib/currency';

describe('first-run checklist', () => {
  it('starts with nothing done for a brand-new account', () => {
    const items = buildChecklist({ hasBranding: false, invoiceCount: 0, anySent: false });
    expect(items.map(i => i.done)).toEqual([false, false, false]);
    expect(checklistComplete(items)).toBe(false);
  });
  it('ticks steps as the user progresses and completes when all are done', () => {
    expect(buildChecklist({ hasBranding: true, invoiceCount: 1, anySent: false }).map(i => i.done)).toEqual([true, true, false]);
    expect(checklistComplete(buildChecklist({ hasBranding: true, invoiceCount: 2, anySent: true }))).toBe(true);
  });
});

describe('legal pages gate', () => {
  it('flags unfinished placeholder details so the pages are not published by accident', () => {
    expect(hasPlaceholders()).toBe(true);
    expect(LEGAL.legalReview.startsWith('[')).toBe(true);
  });
});

describe('invoice amounts', () => {
  it('always shows two decimals with thousands separators', () => {
    expect(formatAmount(12.5)).toBe('12.50');
    expect(formatAmount(1234567.891)).toBe('1,234,567.89');
    expect(formatAmount(0)).toBe('0.00');
    expect(formatAmount(null)).toBe('0.00');
  });
});
