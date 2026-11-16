import { describe, expect, it } from 'vitest';
import { buildFooter, escapeHtml } from '../../supabase/functions/_shared/emailFooter';
import { shouldRetryReminder, RETRY_MAX_AGE_DAYS } from '../../supabase/functions/_shared/retry';
import { buildDataExport } from '@/lib/dataExport';
import { validateNewPassword, MIN_PASSWORD_LENGTH } from '@/lib/passwordRules';

describe('email footer', () => {
  it('tells the recipient who sent it and why, in text and html', () => {
    const f = buildFooter('Acme Design');
    expect(f.text).toContain('Acme Design sent you an invoice using ChaseFlow');
    expect(f.text).toContain('reply to this email');
    expect(f.html).toContain('Acme Design');
  });
  it('falls back to a neutral sender name and escapes markup from the company name', () => {
    expect(buildFooter('').text).toContain('the sender');
    expect(buildFooter(null).text).toContain('the sender');
    const f = buildFooter('<script>x</script>');
    expect(f.html).not.toContain('<script>');
    expect(escapeHtml('a&b<c>')).toBe('a&amp;b&lt;c&gt;');
  });
});

describe('reminder retry', () => {
  const now = new Date('2026-11-16T08:00:00Z');
  it('retries a recently scheduled reminder on the next daily run', () => {
    expect(shouldRetryReminder('2026-11-16T00:00:00Z', now)).toBe(true);
    expect(shouldRetryReminder('2026-11-14T00:00:00Z', now)).toBe(true);
  });
  it('gives up once the reminder is older than the retry window', () => {
    expect(RETRY_MAX_AGE_DAYS).toBe(3);
    expect(shouldRetryReminder('2026-11-12T00:00:00Z', now)).toBe(false);
  });
  it('does not retry an unreadable date', () => {
    expect(shouldRetryReminder('not a date', now)).toBe(false);
  });
});

describe('data export', () => {
  it('contains the profile, invoices and logs with counts, and hides internal plan data', () => {
    const out = buildDataExport({
      profile: { id: 'u1', full_name: 'Sam', plan: 'free' },
      invoices: [{ id: 'i1', items: [{ id: 'x' }] }, { id: 'i2' }],
      activityLogs: [{ id: 'l1' }],
      exportedAt: new Date('2026-11-16T10:00:00Z'),
    });
    expect(out.exported_at).toBe('2026-11-16T10:00:00.000Z');
    expect(out.invoice_count).toBe(2);
    expect(out.activity_log_count).toBe(1);
    expect(out.profile).toEqual({ id: 'u1', full_name: 'Sam' });
  });
  it('handles an account with no profile row or data', () => {
    const out = buildDataExport({ profile: null, invoices: [], activityLogs: [] });
    expect(out.profile).toBeNull();
    expect(out.invoice_count).toBe(0);
  });
});

describe('new password rules', () => {
  it('rejects short passwords and mismatches, accepts a valid pair', () => {
    expect(validateNewPassword('short', 'short')).toContain(String(MIN_PASSWORD_LENGTH));
    expect(validateNewPassword('longenough1', 'different1')).toContain('do not match');
    expect(validateNewPassword('longenough1', 'longenough1')).toBeNull();
  });
});
