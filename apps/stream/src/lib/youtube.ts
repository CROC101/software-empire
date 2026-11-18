import { z } from "zod";

const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

/**
 * The 11-character video id inside any YouTube link people paste (watch, youtu.be, shorts, embed,
 * live, music), or a bare id. Anything else, including look-alike hosts, gives null.
 */
export function youtubeId(input: string): string | null {
  const text = input.trim();
  if (ID.test(text)) return text;
  if (!URL.canParse(text)) return null;
  const url = new URL(text);
  if (!/^https?:$/.test(url.protocol) || !HOSTS.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const id =
    url.hostname === "youtu.be"
      ? parts[0]
      : parts[0] === "watch"
        ? url.searchParams.get("v")
        : ["shorts", "embed", "live", "v"].includes(parts[0] ?? "")
          ? parts[1]
          : null;
  return id && ID.test(id) ? id : null;
}

/** Thumbnails come straight from YouTube's image host (no API key, no copy kept). */
export const thumb = (id: string, size: "hq" | "sd" | "max" = "hq") =>
  `https://i.ytimg.com/vi/${id}/${size}${size === "max" ? "res" : ""}default.jpg`;

/** One of the 3 storyboard frames YouTube keeps for every video (320x180). */
export const frame = (id: string, n: number) => `https://i.ytimg.com/vi/${id}/mq${n}.jpg`;

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const oembedSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(120),
});
export type Oembed = z.infer<typeof oembedSchema>;

/**
 * Title and channel of a public video from YouTube's oEmbed endpoint (no key). Runs in the Worker
 * (and the dev server), never in the browser: the page's CSP only talks to its own origin.
 */
export async function fetchOembed(id: string): Promise<Oembed | null> {
  const ask = new URL("https://www.youtube.com/oembed");
  ask.searchParams.set("format", "json");
  ask.searchParams.set("url", watchUrl(id));
  const res = await fetch(ask);
  if (!res.ok) return null;
  const raw = (await res.json()) as { title?: unknown; author_name?: unknown };
  const parsed = oembedSchema.safeParse({
    title: typeof raw.title === "string" ? raw.title.slice(0, 200) : "",
    author: typeof raw.author_name === "string" ? raw.author_name.slice(0, 120) : "",
  });
  return parsed.success ? parsed.data : null;
}
