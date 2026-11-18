/**
 * Worker in front of the static apps (toolboxes, canva, community, tarot). wrangler.jsonc runs it
 * first for everything except /assets/*, and it only checks page opens: scripts, styles and fonts
 * pass straight through. The hub decides from the admins' switches (hub.gate, via service binding
 * HUB, so the call never leaves Cloudflare): before launch, maintenance, off, or sign in first.
 * APP (wrangler vars) names the app whose switch applies.
 */
import { GATE_PATH } from "./launch";

type Fetcher = { fetch: (input: Request | string, init?: RequestInit) => Promise<Response> };
type Env = { ASSETS: Fetcher; HUB: Fetcher; APP?: string };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const page =
      request.method === "GET" &&
      (request.headers.get("sec-fetch-dest") === "document" ||
        (request.headers.get("accept") ?? "").includes("text/html"));
    if (!page) return env.ASSETS.fetch(request);

    const ask = new URLSearchParams({ app: env.APP ?? "", next: request.url });
    const gate = await env.HUB.fetch(`https://hub${GATE_PATH}?${ask}`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (gate.status === 204) return withSession(gate, await env.ASSETS.fetch(request));
    const { location } = (await gate.json().catch(() => ({}))) as { location?: string };
    // shut, even if the hub's answer is unreadable
    if (!location) return new Response("ยังเปิดไม่ได้ในตอนนี้", { status: 503 });
    return withSession(
      gate,
      new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } }),
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
