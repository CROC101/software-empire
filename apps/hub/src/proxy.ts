import { createServerSupabase } from "@empire/core/supabase";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// signed-in only; /admin also checks cms.is_admin() itself, page and every action
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

/** Refreshes the Supabase session on every request and gates protected pages. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerSupabase(env, {
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet, headers) {
      for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of cookiesToSet) {
        response.cookies.set(name, value, options);
      }
      // stops CDNs from caching a response that carries someone's session
      for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
    },
  });

  // verifies the JWT and refreshes it when close to expiry — must run before any return
  const { data } = await supabase.auth.getClaims();

  const { pathname } = request.nextUrl;
  if (!data && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(login);
    // keep cookies Supabase just cleared or refreshed, and their no-cache headers
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
