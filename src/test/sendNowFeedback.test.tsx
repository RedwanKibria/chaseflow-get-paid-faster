import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CreateInvoicePage from '@/pages/CreateInvoicePage';

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), addInvoice: vi.fn(), warning: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock('@/context/AppContext', () => ({ useApp: () => ({ user: { id: 'user-1', full_name: 'Test User', currency: 'GBP' }, addInvoice: mocks.addInvoice }) }));
vi.mock('@/layouts/DashboardLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/lib/branding', () => ({ resolveLogo: async () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock('sonner', () => ({ toast: { warning: mocks.warning, error: mocks.error, success: mocks.success } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
async function send() {
  mocks.addInvoice.mockResolvedValue('invoice-1');
  render(<CreateInvoicePage type="regular" />);
  fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Client' } });
  fireEvent.change(screen.getByPlaceholderText('john@company.com'), { target: { value: 'client@example.test' } });
  const date = document.querySelector('input[type="date"]'); if (!date) throw new Error('Due date input missing');
  fireEvent.change(date, { target: { value: '2026-12-01' } });
  fireEvent.change(screen.getByPlaceholderText('Service description'), { target: { value: 'Consulting' } });
  const numbers = screen.getAllByRole('spinbutton');
  fireEvent.change(numbers[3], { target: { value: '100' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Invoice Now!' }));
  await waitFor(() => expect(mocks.invoke).toHaveBeenCalledOnce());
}
describe('Send Now response feedback', () => {
  it('warns instead of claiming successful PDF delivery when attachment is absent', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, attached: false }, error: null });
    await send(); await waitFor(() => expect(mocks.warning).toHaveBeenCalledOnce());
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it('surfaces the function error on HTTP 429 without a success notification', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify({ error: 'Daily sending quota reached' }), { status: 429 }) } });
    await send(); await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Daily sending quota reached'));
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it('keeps success feedback for an attached PDF', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, attached: true }, error: null });
    await send(); await waitFor(() => expect(mocks.success).toHaveBeenCalledOnce());
    expect(mocks.warning).not.toHaveBeenCalled();
  });
});