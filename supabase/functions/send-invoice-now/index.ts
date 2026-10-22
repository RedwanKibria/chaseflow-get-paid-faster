// Sends a single invoice immediately to the client (PDF attached).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "ChaseFlow <noreply@chaseflow.online>";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmail(invoice: any) {
  const subject =
    invoice.reminder_email_subject ||
    `Invoice ${invoice.invoice_code} — ${invoice.your_company_name ?? "ChaseFlow"}`;
  const customBody = (invoice.email_body || "").trim();
  const fallback = `Hi ${invoice.client_name ?? "there"},\n\nPlease find your invoice attached.\n\nThank you,\n${invoice.your_company_name ?? "ChaseFlow"}`;
  const text = customBody || fallback;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><div style="max-width:620px;margin:0 auto;padding:24px 20px;"><div style="font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(text).replace(/\n/g, "<br/>")}</div></div></body></html>`;
  return { subject, html, text };
}

async function fetchAttachment(supabase: any, invoice: any) {
  if (!invoice.invoice_file_path) return null;
  const { data } = await supabase.storage.from("invoice-files").download(invoice.invoice_file_path);
  if (!data) return null;
  const buf = new Uint8Array(await data.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return { filename: invoice.invoice_file_name || `${invoice.invoice_code}.pdf`, content: btoa(bin) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { invoice_id } = await req.json();
    if (!invoice_id) return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoice_id).single();
    if (!invoice) return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (invoice.user_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!invoice.client_email) return new Response(JSON.stringify({ error: "No client email on invoice" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [userSends, invoiceSends] = await Promise.all([
      supabase.from("activity_logs").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("action_type", "invoice_sent_now").gte("created_at", since),
      supabase.from("activity_logs").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("invoice_id", invoice.id)
        .eq("action_type", "invoice_sent_now").gte("created_at", since),
    ]);
    if (userSends.error || invoiceSends.error) {
      return new Response(JSON.stringify({ error: "Could not check sending limits. Please try again later." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if ((userSends.count ?? 0) >= 20) {
      return new Response(JSON.stringify({ error: "You have reached the limit of 20 invoice sends in the last 24 hours. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if ((invoiceSends.count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "This invoice has already been sent 3 times in the last 24 hours. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { subject, html, text } = buildEmail(invoice);
    const { data: senderProfile } = await supabase.from("users_profile").select("email").eq("id", invoice.user_id).maybeSingle();
    const replyTo = senderProfile?.email ?? null;
    const attachment = await fetchAttachment(supabase, invoice);

    const body: any = {
      from: FROM_ADDRESS,
      to: [invoice.client_email],
      subject, html, text,
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@chaseflow.online?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
    if (replyTo) body.reply_to = replyTo;
    if (attachment) body.attachments = [attachment];

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": RESEND_API_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Email send failed`, detail: data }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.rpc("add_activity_log", {
      p_actor_user_id: invoice.user_id,
      p_action_type: "invoice_sent_now",
      p_description: `Invoice ${invoice.invoice_code} sent immediately to ${invoice.client_email}`,
      p_invoice_id: invoice.id,
      p_related_user_id: invoice.user_id,
      p_meta: { manual: true, resend_id: data?.id, has_attachment: !!attachment },
    });

    return new Response(JSON.stringify({ ok: true, id: data?.id, attached: !!attachment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-invoice-now error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
