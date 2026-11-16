// Footer added to every invoice and reminder email so the recipient knows why they got it.
// Plain TypeScript with no runtime-specific APIs, so it can be unit tested.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildFooter(senderName: string | null | undefined): { text: string; html: string } {
  const sender = (senderName ?? "").trim() || "the sender";
  const text =
    `You are receiving this email because ${sender} sent you an invoice using ChaseFlow. ` +
    `To ask a question or stop reminders for this invoice, reply to this email to reach ${sender} directly.`;
  const html =
    `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(text)}</div>`;
  return { text, html };
}
