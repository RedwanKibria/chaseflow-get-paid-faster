// Public address of the app, used for links in emails. Set SITE_URL in the function
// secrets once you have a custom domain; until then the Lovable address is used.
export function siteUrl(): string {
  const configured = (Deno.env.get("SITE_URL") ?? "").trim().replace(/\/+$/, "");
  return configured || "https://chaseflowgpf.lovable.app";
}
