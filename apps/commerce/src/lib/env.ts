import { parseSupabaseEnv } from "@empire/core/supabase";
import { z } from "zod";

// literal process.env.NEXT_PUBLIC_* reads so Next inlines them into the browser bundle
export const env = parseSupabaseEnv({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
});

/** Core Hub — every app signs in there (one session cookie for the whole empire). */
export const hubUrl = z.url({ protocol: /^https?$/ }).parse(process.env.NEXT_PUBLIC_HUB_URL);

/** Hub sign-in that sends the user back to `path` on this app. */
export function signInUrl(path = "/"): string {
  const login = new URL("/login", hubUrl);
  login.searchParams.set("next", new URL(path, env.siteUrl).href);
  return login.href;
}
