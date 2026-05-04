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
  const subject =
    invoice.reminder_email_subject ||
    `Invoice ${invoice.invoice_code} — ${invoice.your_company_name ?? "ChaseFlow"}`;

  const customBody = (invoice.email_body || "").trim();
  const fallback = `Hi ${invoice.client_name ?? "there"},\n\nThis is a friendly reminder regarding your invoice. Please find the details below and the invoice attached.\n\nThank you,\n${invoice.your_company_name ?? "ChaseFlow"}`;
  const bodyText = customBody || fallback;
  const bodyHtml = escapeHtml(bodyText).replace(/\n/g, "<br/>");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:620px;margin:0 auto;padding:24px 20px;">
    <div style="font-size:14px;line-height:1.6;color:#334155;">${bodyHtml}</div>
  </div>
</body></html>`.trim();

  // Plain text mirror — keep it nearly identical to HTML so spam filters don't flag mismatch.
  const text = bodyText;

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

        const { subject, html, text } = buildEmailBody(invoice, job.reminder_type);
        const { data: senderProfile } = await supabase.from("users_profile").select("email").eq("id", invoice.user_id).maybeSingle();
        const replyTo = senderProfile?.email ?? null;
        const attachment = await fetchInvoiceAttachment(supabase, invoice);
        const send = await sendViaResend(invoice.client_email, replyTo, subject, html, text, attachment);

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
