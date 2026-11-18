/**
 * The crocwork-stream Worker: the shared launch gate for pages, plus two YouTube helpers.
 * /api/oembed asks YouTube's public oEmbed endpoint (no key) for a video's title and channel.
 * /api/search asks the YouTube Data API (key in the YOUTUBE_API_KEY secret, never sent to the
 * browser) for videos matching a query. Answers are cached; nothing about a video is stored here.
 */
import gate from "../../packages/core/src/launch-gate-worker";
import { searchQuery, searchUrl, toHits } from "./src/lib/search";
import { fetchOembed, youtubeId } from "./src/lib/youtube";

type Fetcher = { fetch: (input: Request | string, init?: RequestInit) => Promise<Response> };
type RateLimit = { limit: (options: { key: string }) => Promise<{ success: boolean }> };
type Env = {
  ASSETS: Fetcher;
  HUB: Fetcher;
  APP?: string;
  YOUTUBE_API_KEY?: string;
  SEARCH_LIMIT?: RateLimit;
};
type Ctx = { waitUntil: (p: Promise<unknown>) => void };
// Workers runtime global; typed here so the app's tsconfig needs no Workers types
declare const caches: { default: Cache };

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/oembed") return oembed(request, url, ctx);
    if (url.pathname === "/api/search") return search(request, url, env, ctx);
    return gate.fetch(request, env);
  },
};

async function oembed(request: Request, url: URL, ctx: Ctx): Promise<Response> {
  if (request.method !== "GET") return new Response(null, { status: 405 });

  const id = youtubeId(url.searchParams.get("id") ?? "");
  if (!id) return Response.json({ error: "not a YouTube link" }, { status: 400 });

  const key = new Request(`https://oembed.cache/${id}`);
  const hit = await caches.default.match(key);
  if (hit) return hit;
  const info = await fetchOembed(id);
  if (!info) return Response.json({ error: "video not found or not embeddable" }, { status: 404 });
  const out = Response.json(info, { headers: { "cache-control": "public, max-age=86400" } });
  ctx.waitUntil(caches.default.put(key, out.clone()));
  return out;
}

// the free key allows about 100 searches a day: the same query is answered from cache for 6 h,
// and each visitor gets a few fresh searches a minute
async function search(request: Request, url: URL, env: Env, ctx: Ctx): Promise<Response> {
  if (request.method !== "GET") return new Response(null, { status: 405 });
  if (!env.YOUTUBE_API_KEY) return Response.json({ error: "search is off" }, { status: 503 });

  const parsed = searchQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return Response.json({ error: "bad query" }, { status: 400 });
  const { q, kind } = parsed.data;

  const key = new Request(`https://search.cache/${kind}/${encodeURIComponent(q.toLowerCase())}`);
  const hit = await caches.default.match(key);
  if (hit) return hit;

  const who = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (env.SEARCH_LIMIT && !(await env.SEARCH_LIMIT.limit({ key: who })).success)
    return Response.json({ error: "too many searches" }, { status: 429 });

  const res = await fetch(searchUrl(q, kind, env.YOUTUBE_API_KEY));
  if (!res.ok) {
    // 403 = quota used up or key restricted; the reason stays in the Worker log, not the browser
    console.error("youtube search", res.status, await res.text());
    return Response.json({ error: "search failed" }, { status: 502 });
  }
  const out = Response.json(toHits(await res.json(), kind), {
    headers: { "cache-control": "public, max-age=21600" },
  });
  ctx.waitUntil(caches.default.put(key, out.clone()));
  return out;
}
