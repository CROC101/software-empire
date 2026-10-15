import { createServerSupabase } from "@empire/core/supabase";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** For Server Components, Server Actions and Route Handlers. Create one per request. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerSupabase(env, {
    getAll: () => cookieStore.getAll(),
    setAll(cookiesToSet) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Server Components cannot write cookies; proxy.ts already refreshed the session
      }
    },
  });
}

/** Verified claims of the signed-in user, or null. Never trust getSession() on the server. */
export async function getClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}
