/**
 * The crocwork-stream Worker: the shared launch gate for pages, plus /api/oembed, which asks
 * YouTube's public oEmbed endpoint (no key) for a video's title and channel. Only real YouTube ids
 * pass, answers are cached for a day, and nothing about the video is stored here.
 */
import gate from "../../packages/core/src/launch-gate-worker";
import { fetchOembed, youtubeId } from "./src/lib/youtube";

type Fetcher = { fetch: (input: Request | string, init?: RequestInit) => Promise<Response> };
type Env = { ASSETS: Fetcher; HUB: Fetcher; APP?: string };
type Ctx = { waitUntil: (p: Promise<unknown>) => void };
// Workers runtime global; typed here so the app's tsconfig needs no Workers types
declare const caches: { default: Cache };

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/api/oembed") return gate.fetch(request, env);
    if (request.method !== "GET") return new Response(null, { status: 405 });

    const id = youtubeId(url.searchParams.get("id") ?? "");
    if (!id) return Response.json({ error: "not a YouTube link" }, { status: 400 });

    const key = new Request(`https://oembed.cache/${id}`);
    const hit = await caches.default.match(key);
    if (hit) return hit;
    const info = await fetchOembed(id);
    if (!info)
      return Response.json({ error: "video not found or not embeddable" }, { status: 404 });
    const out = Response.json(info, { headers: { "cache-control": "public, max-age=86400" } });
    ctx.waitUntil(caches.default.put(key, out.clone()));
    return out;
  },
};
