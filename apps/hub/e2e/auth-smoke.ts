/**
 * Auth smoke test against a running hub + local Supabase:
 *   pnpm db:start && pnpm --filter @empire/hub dev
 *   pnpm --filter @empire/hub smoke
 * Creates a throwaway smoke-*@example.com user each run (local DB only).
 */
import assert from "node:assert/strict";
import { createServerSupabase, parseSupabaseEnv } from "@empire/core/supabase";

const env = parseSupabaseEnv({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
});
assert.match(env.url, /localhost|127\.0\.0\.1/, "smoke test signs up users — local Supabase only");

const get = (path: string, cookie?: string) =>
  fetch(new URL(path, env.siteUrl), {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });

const home = await get("/");
assert.equal(home.status, 200);
for (const header of ["content-security-policy", "x-content-type-options", "referrer-policy"]) {
  assert.ok(home.headers.get(header), `missing ${header}`);
}
assert.equal(home.headers.get("x-powered-by"), null);
console.log("ok  / 200 with security headers");

const anon = await get("/dashboard");
assert.equal(anon.status, 307);
assert.equal(anon.headers.get("location"), "/login?next=%2Fdashboard");
console.log("ok  anonymous /dashboard -> login");

// sign up with the same cookie format and options the hub uses
const jar = new Map<string, string>();
const supabase = createServerSupabase(env, {
  getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  setAll: (cookies) => {
    for (const { name, value } of cookies) {
      if (value) jar.set(name, value);
      else jar.delete(name);
    }
  },
});
const email = `smoke-${String(Date.now())}@example.com`;
const { error } = await supabase.auth.signUp({ email, password: crypto.randomUUID() });
assert.equal(error, null);
const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
console.log("ok  signed up", email);

const dashboard = await get("/dashboard", cookie);
assert.equal(dashboard.status, 200);
assert.ok((await dashboard.text()).includes(email), "dashboard does not show the user");
console.log("ok  /dashboard shows the verified email");

const evil = await get("/login?next=//evil.com", cookie);
assert.equal(new URL(evil.headers.get("location") ?? "", env.siteUrl).origin, env.siteUrl);
console.log("ok  ?next=//evil.com stays on", env.siteUrl);

const forged = await get("/dashboard", cookie.replace(/.{12}$/, "AAAAAAAAAAAA"));
assert.equal(forged.status, 307);
console.log("ok  forged session cookie rejected");
