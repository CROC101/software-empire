import {
  createBrowserClient,
  createServerClient,
  type CookieMethodsServer,
  type CookieOptionsWithName,
} from "@supabase/ssr";
import { z } from "zod";
import type { Database } from "./database.types";

export type { Database };

const httpUrl = z.url({ protocol: /^https?$/ });

/**
 * Public config shared by every app. These values ship to the browser:
 * never put a secret or `service_role` key here.
 */
export const supabaseEnvSchema = z.object({
  url: httpUrl,
  publishableKey: z.string().min(1),
  /** This app's own origin, e.g. https://hub.example.com — auth redirects come back here. */
  siteUrl: httpUrl,
  /** Parent domain (".example.com") so all subdomain apps share one session. Unset on localhost. */
  cookieDomain: z.string().min(1).optional(),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

type RawEnv = { [K in keyof SupabaseEnv]: string | undefined };

export function parseSupabaseEnv(raw: RawEnv): SupabaseEnv {
  // .env files turn "unset" into "" — treat it as missing
  return supabaseEnvSchema.parse({ ...raw, cookieDomain: raw.cookieDomain || undefined });
}

/** Identical in every app, otherwise apps on different subdomains stop seeing one session. */
export function authCookieOptions(env: SupabaseEnv): CookieOptionsWithName {
  return {
    domain: env.cookieDomain,
    path: "/",
    sameSite: "lax",
    secure: env.siteUrl.startsWith("https:"),
  };
}

export function createBrowserSupabase(env: SupabaseEnv) {
  return createBrowserClient<Database>(env.url, env.publishableKey, {
    cookieOptions: authCookieOptions(env),
  });
}

/** One client per request — the cache headers handed to `setAll` are sent only once per client. */
export function createServerSupabase(env: SupabaseEnv, cookies: CookieMethodsServer) {
  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies,
    cookieOptions: authCookieOptions(env),
  });
}
