/**
 * Worker in front of the static apps (toolboxes, canva, community, tarot) until launch.
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
    if (gate.status === 204) return withSession(gate, await env.ASSETS.fetch(request));
    const { hub } = (await gate.json().catch(() => ({}))) as { hub?: string };
    // shut, even if the hub's answer is unreadable
    if (!hub) return new Response("เร็ว ๆ นี้", { status: 503 });
    return withSession(
      gate,
      new Response(null, { status: 302, headers: { location: hub, "cache-control": "no-store" } }),
    );
  },
};

/**
 * The hub may have refreshed the session while answering (rotating the refresh token). Those
 * cookies must reach the browser: dropped, the browser replays the old refresh token and
 * Supabase revokes the whole session, so admins were logged out onto the countdown.
 */
export function withSession(gate: Response, response: Response): Response {
  const cookies = gate.headers.getSetCookie();
  if (cookies.length === 0) return response;
  const out = new Response(response.body, response);
  for (const cookie of cookies) out.headers.append("set-cookie", cookie);
  out.headers.set("cache-control", "private, no-store");
  return out;
}
