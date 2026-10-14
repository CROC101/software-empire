import { createBrowserSupabase, parseSupabaseEnv } from "@empire/core/supabase";

/** Reads and refreshes the session cookie the hub set — same cookie options, so one sign-in covers every app. */
export const supabase = createBrowserSupabase(
  parseSupabaseEnv({
    url: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: import.meta.env.VITE_SITE_URL,
    cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN,
  }),
);
