import { parseSupabaseEnv } from "@empire/core/supabase";
import { z } from "zod";

export const env = {
  supabase: parseSupabaseEnv({
    url: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: import.meta.env.VITE_SITE_URL,
    cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN,
  }),
  /** Core Hub — sign-in and account pages live there. */
  hubUrl: z.url({ protocol: /^https?$/ }).parse(import.meta.env.VITE_HUB_URL),
};
