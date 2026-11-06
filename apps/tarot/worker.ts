/**
 * The crocwork-tarot Worker: the shared launch gate for pages, plus the daily reminder. At 08:00
 * Bangkok (cron in wrangler.jsonc) it lists every subscribed browser with the Supabase service
 * key and sends each an empty push; the app's service worker (public/sw.js) shows the text.
 * Push services answer 404/410 for browsers that unsubscribed; those rows are removed.
 *
 * Secrets (Cloudflare → crocwork-tarot → Settings → Variables and Secrets):
 *   SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY. Without them the reminder skips quietly.
 */
import gate from "../../packages/core/src/launch-gate-worker";
import { VAPID_PUBLIC_KEY } from "./src/lib/vapid-public";
import { vapidHeaders } from "./src/lib/vapid";

type Fetcher = { fetch: (input: Request | string, init?: RequestInit) => Promise<Response> };
type Env = {
  ASSETS: Fetcher;
  HUB: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
};
type Ctx = { waitUntil: (p: Promise<unknown>) => void };

export default {
  fetch: (request: Request, env: Env) => gate.fetch(request, env),
  scheduled(_event: unknown, env: Env, ctx: Ctx) {
    ctx.waitUntil(remind(env));
  },
};

async function remind(env: Env) {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, VAPID_PRIVATE_KEY: privateKey } = env;
  if (!url || !key || !privateKey) {
    console.log(
      "reminder skipped: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or VAPID_PRIVATE_KEY not set",
    );
    return;
  }
  // new secret keys go in apikey alone; a legacy service_role JWT also needs the bearer header
  const auth: Record<string, string> = key.startsWith("eyJ")
    ? { apikey: key, Authorization: `Bearer ${key}` }
    : { apikey: key };
  const table = `${url}/rest/v1/push_subscriptions`;

  const res = await fetch(`${table}?select=endpoint`, {
    headers: { ...auth, "Accept-Profile": "tarot" },
  });
  if (!res.ok) {
    console.log(`reminder: listing subscriptions failed (${String(res.status)})`);
    return;
  }
  const subs = (await res.json()) as { endpoint: string }[];
  const keys = {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey,
    subject: env.VAPID_SUBJECT ?? "https://crocwork.studio",
  };
  // one signature per push service (FCM, Mozilla, Apple…), not per browser
  const signed = new Map<string, Promise<{ Authorization: string }>>();
  const gone: string[] = [];

  await Promise.allSettled(
    subs.map(async ({ endpoint }) => {
      const origin = new URL(endpoint).origin;
      if (!signed.has(origin)) signed.set(origin, vapidHeaders(endpoint, keys));
      const headers = await (signed.get(origin) ?? vapidHeaders(endpoint, keys));
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { ...headers, TTL: "43200", Urgency: "normal", "Content-Length": "0" },
      });
      if (r.status === 404 || r.status === 410) gone.push(endpoint);
    }),
  );

  if (gone.length) {
    const list = gone.map((e) => `"${e.replaceAll('"', "")}"`).join(",");
    await fetch(`${table}?endpoint=in.(${encodeURIComponent(list)})`, {
      method: "DELETE",
      headers: { ...auth, "Content-Profile": "tarot" },
    });
  }
  console.log(
    `reminder: sent ${String(subs.length - gone.length)}, removed ${String(gone.length)}`,
  );
}
