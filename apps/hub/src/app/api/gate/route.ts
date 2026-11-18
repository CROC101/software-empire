import { gateTarget, readGate } from "@empire/core/launch";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const NO_STORE = { "cache-control": "no-store" };

/**
 * Asked by the static apps' gate Worker with the visitor's cookies (shared across subdomains)
 * and ?app=<slug>&next=<the page they opened>: 204 lets them in, 403 { location } sends them on.
 */
export async function GET(request: Request) {
  const ask = new URL(request.url).searchParams;
  const app = ask.get("app") ?? "";
  const supabase = await createClient();
  // refreshes the session first; the worker hands the new cookies to the browser
  await supabase.auth.getClaims();
  const { verdict } = await readGate(supabase, app);
  const location = gateTarget(verdict, env.siteUrl, app, ask.get("next") ?? env.siteUrl);
  return location
    ? Response.json({ location }, { status: 403, headers: NO_STORE })
    : new Response(null, { status: 204, headers: NO_STORE });
}
