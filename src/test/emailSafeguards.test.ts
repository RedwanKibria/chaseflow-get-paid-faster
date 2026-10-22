// Execute the actual edge handlers with isolated clients; no real email is sent.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

const now = Date.parse('2026-10-22T00:00:00Z');
const invoice = { id: 'invoice-1', user_id: 'user-1', client_email: 'client@example.test', invoice_code: 'INV-1' };
function handler(name: string, options: { user?: boolean; userCount?: number; invoiceCount?: number; owner?: string } = {}) {
  const filters: unknown[][] = [];
  let emailBody: Record<string, unknown> | undefined;
  const query = (table: string) => {
    let sameInvoice = false;
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (key: string, value: unknown) => { filters.push([key, value]); if (key === 'invoice_id') sameInvoice = true; return q; },
      gte: (key: string, value: unknown) => { filters.push([key, value]); return q; },
      single: async () => ({ data: { ...invoice, user_id: options.owner ?? invoice.user_id } }),
      maybeSingle: async () => ({ data: { email: 'owner@example.test' } }),
      then: (done: (v: unknown) => unknown) => Promise.resolve({ count: table === 'activity_logs' ? (sameInvoice ? options.invoiceCount ?? 0 : options.userCount ?? 0) : 0, error: null }).then(done),
    };
    return q;
  };
  const getUser = vi.fn(async () => ({ data: { user: options.user === false ? null : { id: 'user-1', email: 'owner@example.test' } }, error: null }));
  const client = { auth: { getUser }, from: query, rpc: async () => ({ error: null }) };
  let serve: ((request: Request) => Promise<Response>) | undefined;
  const source = readFileSync(resolve(`supabase/functions/${name}/index.ts`), 'utf8').replace(/^import .*createClient.*;\s*$/m, '');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  class FixedDate extends Date { static now() { return now; } }
  vm.runInNewContext(code, {
    Request, Response, Date: FixedDate, console, Uint8Array, btoa,
    createClient: () => client,
    Deno: { env: { get: () => 'test-only-placeholder' }, serve: (fn: typeof serve) => { serve = fn; } },
    fetch: async (_url: string, init: RequestInit) => { emailBody = JSON.parse(String(init.body)); return new Response(JSON.stringify({ id: 'test-email' }), { status: 200 }); },
  });
  return { run: async (auth = true) => {
    if (!serve) throw new Error('Handler was not registered');
    return serve(new Request('http://localhost/test', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer test-token' } : {}) }, body: JSON.stringify({ email: 'other@example.test', invoice_id: invoice.id }) }));
  }, filters, getUser, emailBody: () => emailBody };
}

describe('Welcome email authentication', () => {
  it('returns 401 without Authorization', async () => expect((await handler('send-welcome-email').run(false)).status).toBe(401));
  it('returns 401 for an invalid user JWT', async () => expect((await handler('send-welcome-email', { user: false }).run()).status).toBe(401));
  it('verifies getUser and ignores request email, sending only to the signed-in email', async () => {
    const h = handler('send-welcome-email'); expect((await h.run()).status).toBe(200);
    expect(h.getUser).toHaveBeenCalledOnce(); expect(h.emailBody()?.to).toEqual(['owner@example.test']);
  });
});
describe('Send Now rolling limits', () => {
  it('rejects the user at 20 sends in 24 hours with 429', async () => {
    const h = handler('send-invoice-now', { userCount: 20 }); const response = await h.run();
    expect(response.status).toBe(429); expect((await response.json()).error).toContain('20'); expect(h.emailBody()).toBeUndefined();
    expect(h.filters).toContainEqual(['created_at', '2026-10-21T00:00:00.000Z']);
    expect(h.filters).toContainEqual(['user_id', 'user-1']); expect(h.filters).toContainEqual(['action_type', 'invoice_sent_now']);
  });
  it('rejects the same invoice at 3 sends in 24 hours with 429', async () => {
    const h = handler('send-invoice-now', { invoiceCount: 3 }); const response = await h.run();
    expect(response.status).toBe(429); expect((await response.json()).error).toContain('3 times'); expect(h.emailBody()).toBeUndefined();
    expect(h.filters).toContainEqual(['invoice_id', 'invoice-1']);
  });
  it('allows 19 user sends and 2 invoice sends', async () => expect((await handler('send-invoice-now', { userCount: 19, invoiceCount: 2 }).run()).status).toBe(200));
  it('keeps ownership enforcement', async () => expect((await handler('send-invoice-now', { owner: 'other-user' }).run()).status).toBe(403));
});