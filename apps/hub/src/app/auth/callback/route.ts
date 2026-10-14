import { safeRedirectPath } from "@empire/core/redirect";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** PKCE landing for email confirmation and OAuth: swaps ?code= for a session cookie. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, env.siteUrl));
  }

  return NextResponse.redirect(new URL("/login?error=callback", env.siteUrl));
}
