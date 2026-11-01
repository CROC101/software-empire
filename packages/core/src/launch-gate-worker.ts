/**
 * Worker in front of the static apps (toolboxes, canva, community) until launch.
 * wrangler.jsonc runs it first for everything except /assets/*, and it only checks page opens:
 * scripts, styles and fonts pass straight through. The hub decides (service binding HUB, so the
 * call never leaves Cloudflare): admins get the app, everyone else the hub's countdown.
 */
import { GATE_PATH, launched } from "./launch";

type Fetcher = { fetch: (input: Request | string, init?: RequestInit) => Promise<Response> };
type Env = { ASSETS: Fetcher; HUB: Fetcher };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const page =
      request.method === "GET" &&
      (request.headers.get("sec-fetch-dest") === "document" ||
        (request.headers.get("accept") ?? "").includes("text/html"));
    if (launched() || !page) return env.ASSETS.fetch(request);

    const gate = await env.HUB.fetch(`https://hub${GATE_PATH}`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (gate.status === 204) return env.ASSETS.fetch(request);
    const { hub } = (await gate.json().catch(() => ({}))) as { hub?: string };
    // shut, even if the hub's answer is unreadable
    if (!hub) return new Response("เร็ว ๆ นี้", { status: 503 });
    return new Response(null, {
      status: 302,
      headers: { location: hub, "cache-control": "no-store" },
    });
  },
};
