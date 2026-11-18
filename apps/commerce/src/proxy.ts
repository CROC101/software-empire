import { createServerSupabase, expireHostOnlyAuthCookies } from "@empire/core/supabase";
import { gateTarget, readGate } from "@empire/core/launch";
import { NextResponse, type NextRequest } from "next/server";
import { env, hubUrl, signInUrl } from "@/lib/env";

// with the login switch off the catalogue is public; buying and selling still need an account
const PROTECTED_PREFIXES = ["/orders", "/sell"];

/** Refreshes the Supabase session on every request and sends guests to the hub to sign in. */
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

  const { pathname, search } = request.nextUrl;

  // the admins' switches (hub /admin/system); turn "login" off there to make the catalogue public
  if (!/\.[a-z0-9]+$/i.test(pathname)) {
    const { verdict } = await readGate(supabase, "commerce");
    const location = gateTarget(verdict, hubUrl, "commerce", request.url);
    if (location) return carry(response, NextResponse.redirect(location));
  }

  if (!data && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return carry(response, NextResponse.redirect(signInUrl(pathname + search)));
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
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2)$).*)",
  ],
};
