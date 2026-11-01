import { launched } from "@empire/core/launch";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const NO_STORE = { "cache-control": "no-store" };

/**
 * Asked by the static apps' gate Worker with the visitor's cookies (shared across subdomains):
 * 204 lets them in, 403 sends them to the hub's countdown.
 */
export async function GET() {
  if (launched()) return new Response(null, { status: 204, headers: NO_STORE });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const admin = data ? (await supabase.schema("cms").rpc("is_admin")).data === true : false;
  return admin
    ? new Response(null, { status: 204, headers: NO_STORE })
    : Response.json({ hub: env.siteUrl }, { status: 403, headers: NO_STORE });
}
