import { createServerSupabase } from "@empire/core/supabase";
import { launched } from "@empire/core/launch";
import { NextResponse, type NextRequest } from "next/server";
import { env, hubUrl, signInUrl } from "@/lib/env";

// the catalogue is public (SEO); buying, selling and the wallet need an account
const PROTECTED_PREFIXES = ["/orders", "/sell"];

/** Refreshes the Supabase session on every request and sends guests to the hub to sign in. */
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

  const { pathname, search } = request.nextUrl;

  // before launch (1 Jan 2570) only CMS admins get in; everyone else sees the hub's countdown
  if (!launched() && !/\.[a-z0-9]+$/i.test(pathname)) {
    const admin = data ? (await supabase.schema("cms").rpc("is_admin")).data === true : false;
    if (!admin) return carry(response, NextResponse.redirect(hubUrl));
  }

  if (!data && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return carry(response, NextResponse.redirect(signInUrl(pathname + search)));
  }

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
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf)$).*)",
  ],
};
