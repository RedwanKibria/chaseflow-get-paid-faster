// Daily reminder processor: marks reminders sent and emails clients via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "ChaseFlow <noreply@chaseflow.online>";

function fmtMoney(n: number) {
  return Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailBody(invoice: any, reminderType: string) {
  const titleMap: Record<string, string> = {
    before_3: "Friendly reminder — payment due in 3 days",
    due: "Payment due today",
    after_3: "Payment overdue — 3 days past due",
    after_7: "Payment overdue — 7 days past due",
    after_14: "Payment overdue — 14 days past due",
  };
  const heading = titleMap[reminderType] ?? "Payment reminder";
  const subject =
    invoice.reminder_email_subject ||
    `Invoice ${invoice.invoice_code} from ${invoice.your_company_name ?? "ChaseFlow"}`;

  const customBody = (invoice.email_body || "").trim();
  const bodyHtml = customBody
    ? escapeHtml(customBody).replace(/\n/g, "<br/>")
    : `Hi ${escapeHtml(invoice.client_name ?? "there")},<br/><br/>This is a reminder that invoice <strong>${escapeHtml(invoice.invoice_code)}</strong> is ${reminderType === "before_3" ? "due in 3 days" : reminderType === "due" ? "due today" : "now overdue"}.`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#1d4ed8;">${heading}</h1>
      <p style="margin:0 0 18px;font-size:13px;color:#64748b;">Invoice ${escapeHtml(invoice.invoice_code)}</p>
      <div style="font-size:14px;line-height:1.6;color:#334155;margin-bottom:18px;">${bodyHtml}</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;margin:0 0 18px;">
        <tr><td style="padding:6px 0;"><strong>Reference</strong></td><td style="text-align:right;">${escapeHtml(invoice.invoice_reference ?? "—")}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Invoice date</strong></td><td style="text-align:right;">${escapeHtml(invoice.invoice_date ?? "—")}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Due date</strong></td><td style="text-align:right;">${escapeHtml(invoice.due_date ?? "—")}</td></tr>
        <tr><td style="padding:6px 0;border-top:1px solid #e5e7eb;"><strong>Total amount</strong></td><td style="text-align:right;border-top:1px solid #e5e7eb;font-weight:600;">${fmtMoney(invoice.total_amount)}</td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">— ${escapeHtml(invoice.your_company_name ?? "ChaseFlow")}</p>
    </div>
  </div>
</body></html>`.trim();

  const text = `${heading}\nInvoice ${invoice.invoice_code}\n\n${customBody || `Hi ${invoice.client_name ?? "there"}, this is a reminder that invoice ${invoice.invoice_code} is ${reminderType === "due" ? "due today" : reminderType === "before_3" ? "due in 3 days" : "overdue"}.`}\n\nReference: ${invoice.invoice_reference ?? "-"}\nInvoice date: ${invoice.invoice_date ?? "-"}\nDue date: ${invoice.due_date ?? "-"}\nTotal: ${fmtMoney(invoice.total_amount)}\n\n— ${invoice.your_company_name ?? "ChaseFlow"}`;

  return { subject, html, text };
}

async function fetchInvoiceAttachment(supabase: any, invoice: any) {
  if (!invoice.invoice_file_path) return null;
  const { data, error } = await supabase.storage.from("invoice-files").download(invoice.invoice_file_path);
  if (error || !data) return null;
  const buf = new Uint8Array(await data.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const base64 = btoa(binary);
  return { filename: invoice.invoice_file_name || `${invoice.invoice_code}.pdf`, content: base64 };
}

async function sendViaResend(to: string, replyTo: string | null, subject: string, html: string, text: string, attachment: any | null) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return { ok: false, error: "Missing email API credentials" };
  }
  const body: any = {
    from: FROM_ADDRESS,
    to: [to],
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@chaseflow.online?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
  if (replyTo) body.reply_to = replyTo;
  if (attachment) body.attachments = [attachment];

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(data)}` };
  return { ok: true, id: data?.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();
    const { data: pendingJobs, error: jobsError } = await supabase
      .from("reminder_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(100);

    if (jobsError) {
      console.error("Error fetching reminder jobs:", jobsError);
      return new Response(JSON.stringify({ error: "Failed to fetch reminder jobs" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(JSON.stringify({ message: "No pending reminders", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const job of pendingJobs) {
      try {
        const { data: invoice } = await supabase.from("invoices").select("*").eq("id", job.invoice_id).single();
        if (!invoice) { results.push({ jobId: job.id, status: "skipped", reason: "invoice not found" }); continue; }

        if (invoice.is_deleted || invoice.paid || invoice.status === "cancelled") {
          await supabase.from("reminder_jobs").update({ status: "cancelled" }).eq("id", job.id);
          results.push({ jobId: job.id, status: "cancelled" });
          continue;
        }

        if (!invoice.client_email) {
          await supabase.from("reminder_jobs").update({ status: "cancelled" }).eq("id", job.id);
          results.push({ jobId: job.id, status: "skipped", reason: "no client email" });
          continue;
        }

        const { subject, html } = buildEmailBody(invoice, job.reminder_type);
        const send = await sendViaResend(invoice.client_email, subject, html);

        const sentFieldMap: Record<string, string> = {
          before_3: "before_3_sent", due: "due_sent",
          after_3: "after_3_sent", after_7: "after_7_sent", after_14: "after_14_sent",
        };
        const sentAtFieldMap: Record<string, string> = {
          before_3: "before_3_sent_at", due: "due_sent_at",
          after_3: "after_3_sent_at", after_7: "after_7_sent_at", after_14: "after_14_sent_at",
        };

        if (send.ok) {
          const sentField = sentFieldMap[job.reminder_type];
          const sentAtField = sentAtFieldMap[job.reminder_type];
          if (sentField && sentAtField) {
            await supabase.from("invoices").update({ [sentField]: true, [sentAtField]: now }).eq("id", invoice.id);
          }
          await supabase.from("reminder_jobs").update({ status: "sent", sent_at: now }).eq("id", job.id);
          await supabase.rpc("add_activity_log", {
            p_actor_user_id: invoice.user_id,
            p_action_type: "reminder_sent",
            p_description: `Reminder (${job.reminder_type}) emailed to ${invoice.client_email} for ${invoice.invoice_code}`,
            p_invoice_id: invoice.id,
            p_related_user_id: invoice.user_id,
            p_meta: { reminder_type: job.reminder_type, email: invoice.client_email, resend_id: send.id },
          });
          results.push({ jobId: job.id, status: "sent", email: invoice.client_email });
        } else {
          console.error("Send failure", job.id, send.error);
          await supabase.from("reminder_jobs").update({ status: "failed" }).eq("id", job.id);
          results.push({ jobId: job.id, status: "failed", error: send.error });
        }
      } catch (err) {
        console.error(`Job ${job.id} error`, err);
        results.push({ jobId: job.id, status: "error", error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      processed: results.filter(r => r.status === "sent").length,
      total: results.length,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
