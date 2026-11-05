import { createServerSupabase, expireHostOnlyAuthCookies } from "@empire/core/supabase";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { launched, openBeforeLaunch } from "@/lib/launch";

// signed-in only; /admin also checks cms.is_admin() itself, page and every action
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

/** Refreshes the Supabase session on every request and gates protected pages. */
export async function proxy(request: NextRequest) {
  return dropStaleTwins(request, await gate(request));
}

async function gate(request: NextRequest) {
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

  const gated = !launched() && !openBeforeLaunch(pathname);
  if (gated || pathname.startsWith("/admin")) {
    const admin = data ? (await supabase.schema("cms").rpc("is_admin")).data === true : false;
    // before launch only CMS admins see the site; everyone else gets the countdown at this URL
    if (gated && !admin)
      return carry(response, NextResponse.rewrite(new URL("/soon", request.url)));
    // an admin's password alone is not enough: the session must have passed the TOTP code
    if (admin && data?.claims.aal !== "aal2") {
      const mfa = new URL("/mfa", request.url);
      mfa.searchParams.set("next", pathname);
      return carry(response, NextResponse.redirect(mfa));
    }
  }

  if (!data && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return carry(response, NextResponse.redirect(login));
  }

  return response;
}

/** Expires host-only auth cookies left from before COOKIE_DOMAIN; they shadowed real logins. */
function dropStaleTwins(request: NextRequest, response: NextResponse) {
  const names = request.cookies.getAll().map((cookie) => cookie.name);
  for (const line of expireHostOnlyAuthCookies(names, env))
    response.headers.append("set-cookie", line);
  return response;
}

/** Keeps cookies Supabase just cleared or refreshed, and their no-cache headers. */
function carry(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
