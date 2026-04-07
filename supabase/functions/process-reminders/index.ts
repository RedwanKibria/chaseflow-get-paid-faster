import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find pending reminder jobs that are due
    const now = new Date().toISOString();
    const { data: pendingJobs, error: jobsError } = await supabase
      .from("reminder_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (jobsError) {
      console.error("Error fetching reminder jobs:", jobsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch reminder jobs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending reminders to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { jobId: string; status: string; error?: string }[] = [];

    for (const job of pendingJobs) {
      try {
        // Fetch the invoice
        const { data: invoice, error: invError } = await supabase
          .from("invoices")
          .select("*")
          .eq("id", job.invoice_id)
          .single();

        if (invError || !invoice) {
          results.push({ jobId: job.id, status: "skipped", error: "Invoice not found" });
          continue;
        }

        // Skip if invoice is deleted, paid, or cancelled
        if (invoice.is_deleted || invoice.paid || invoice.status === "cancelled") {
          await supabase
            .from("reminder_jobs")
            .update({ status: "cancelled" })
            .eq("id", job.id);
          results.push({ jobId: job.id, status: "cancelled" });
          continue;
        }

        // Skip if no client email
        if (!invoice.client_email) {
          results.push({ jobId: job.id, status: "skipped", error: "No client email" });
          continue;
        }

        // Fetch invoice items for PDF generation
        const { data: items } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoice.id)
          .order("item_no");

        // Generate PDF content as base64 (simplified - stores key data for later email)
        const pdfData = {
          invoice_code: invoice.invoice_code,
          client_name: invoice.client_name,
          client_email: invoice.client_email,
          client_company: invoice.client_company,
          your_company_name: invoice.your_company_name,
          invoice_reference: invoice.invoice_reference,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          total_amount: invoice.total_amount,
          subtotal_amount: invoice.subtotal_amount,
          vat_percent: invoice.vat_percent,
          vat_amount: invoice.vat_amount,
          tax_percent: invoice.tax_percent,
          tax_amount: invoice.tax_amount,
          invoice_type: invoice.invoice_type,
          status: invoice.status,
          items: items ?? [],
        };

        // Store reminder processing metadata
        const reminderMeta = {
          reminder_type: job.reminder_type,
          scheduled_for: job.scheduled_for,
          processed_at: now,
          email_subject: invoice.reminder_email_subject || `Payment Reminder - ${invoice.invoice_code}`,
          email_body: invoice.email_body || `Reminder for invoice ${invoice.invoice_code}`,
          client_email: invoice.client_email,
          pdf_data: pdfData,
          // Email sending is deferred until email domain is configured
          email_sent: false,
          email_deferred_reason: "Email domain not configured yet",
        };

        // Update the sent flag on the invoice based on reminder type
        const sentFieldMap: Record<string, string> = {
          before_3: "before_3_sent",
          due: "due_sent",
          after_3: "after_3_sent",
          after_7: "after_7_sent",
          after_14: "after_14_sent",
        };
        const sentAtFieldMap: Record<string, string> = {
          before_3: "before_3_sent_at",
          due: "due_sent_at",
          after_3: "after_3_sent_at",
          after_7: "after_7_sent_at",
          after_14: "after_14_sent_at",
        };

        const sentField = sentFieldMap[job.reminder_type];
        const sentAtField = sentAtFieldMap[job.reminder_type];

        if (sentField && sentAtField) {
          await supabase
            .from("invoices")
            .update({
              [sentField]: true,
              [sentAtField]: now,
            })
            .eq("id", invoice.id);
        }

        // Mark reminder job as sent
        await supabase
          .from("reminder_jobs")
          .update({ status: "sent", sent_at: now })
          .eq("id", job.id);

        // Log activity
        await supabase.rpc("add_activity_log", {
          p_actor_user_id: invoice.user_id,
          p_action_type: "reminder_processed",
          p_description: `Reminder (${job.reminder_type}) processed for ${invoice.invoice_code}`,
          p_invoice_id: invoice.id,
          p_related_user_id: invoice.user_id,
          p_meta: JSON.stringify(reminderMeta),
        });

        results.push({ jobId: job.id, status: "processed" });
      } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        results.push({ jobId: job.id, status: "error", error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} reminder(s)`,
        processed: results.filter((r) => r.status === "processed").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
