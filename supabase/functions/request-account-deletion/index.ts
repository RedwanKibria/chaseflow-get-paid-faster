// Handles "Request account deletion" from Settings.
// Switches the account off immediately (the user can no longer sign in to the app),
// hides their invoices, cancels pending reminders and records the request in the activity
// log so an administrator can finish removing the data. It does not erase rows itself.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") return json({ error: "Confirmation required" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Cancel pending reminders for this user's invoices first.
    const { data: invoices, error: invError } = await admin.from("invoices").select("id").eq("user_id", user.id);
    if (invError) return json({ error: "Could not process your request" }, 500);
    const ids = (invoices ?? []).map((i: { id: string }) => i.id);
    for (let i = 0; i < ids.length; i += 100) {
      await admin.from("reminder_jobs").update({ status: "cancelled" }).in("invoice_id", ids.slice(i, i + 100)).eq("status", "pending");
    }

    const { error: hideError } = await admin.from("invoices").update({ is_deleted: true }).eq("user_id", user.id);
    if (hideError) return json({ error: "Could not process your request" }, 500);

    // Switch the account off last, so a failure above can be retried by the user.
    const { error: accessError } = await admin.from("user_access").update({ is_active: false }).eq("user_id", user.id);
    if (accessError) return json({ error: "Could not process your request" }, 500);

    await admin.rpc("add_activity_log", {
      p_actor_user_id: user.id,
      p_action_type: "account_deletion_requested",
      p_description: `Account deletion requested by ${user.email ?? user.id}`,
      p_invoice_id: null,
      p_related_user_id: user.id,
      p_meta: { invoices_hidden: ids.length },
    });

    return json({ ok: true });
  } catch (err) {
    console.error("request-account-deletion error:", err);
    return json({ error: "Could not process your request" }, 500);
  }
});
