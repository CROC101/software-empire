import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Every /admin page calls this (the layout alone is not enough: it is not re-run on every
 * navigation). Signed out: to the login. Signed in but not a CMS admin: the page does not exist.
 */
export async function requireAdmin(next: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { data: admin } = await supabase.schema("cms").rpc("is_admin");
  if (admin !== true) notFound();
  return supabase;
}
