import { parseSupabaseEnv } from "@empire/core/supabase";

// literal process.env.NEXT_PUBLIC_* reads so Next inlines them into the browser bundle
export const env = parseSupabaseEnv({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
});
