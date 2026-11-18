import { z } from "zod";

export const KINDS = ["video", "movie", "music", "short"] as const;
export type Kind = (typeof KINDS)[number];

const ID = z.string().regex(/^[A-Za-z0-9_-]{11}$/);

/** One search hit, in the same shape as a saved video so every mode can show it. */
const hit = z.object({
  youtube_id: ID,
  kind: z.enum(KINDS),
  title: z.string(),
  author: z.string(),
  created_at: z.string(),
});
export type Hit = z.infer<typeof hit>;

export const searchQuery = z.object({
  q: z.string().trim().min(1).max(100),
  kind: z.enum(KINDS).catch("video"),
});

// what each mode asks YouTube for; safeSearch strict everywhere (Tube is a grid, not adult content)
const BY_KIND: Record<Kind, Record<string, string>> = {
  video: {},
  movie: { videoDuration: "long" },
  music: { videoCategoryId: "10" },
  short: { videoDuration: "short" },
};

/** The YouTube Data API v3 search.list URL for one mode; only embeddable videos come back. */
export function searchUrl(q: string, kind: Kind, key: string): URL {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  const params = {
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "strict",
    maxResults: "24",
    q: kind === "short" ? `${q} #shorts` : q,
    key,
    ...BY_KIND[kind],
  };
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  return url;
}

const answer = z.object({
  items: z.array(
    z.object({
      id: z.object({ videoId: ID.optional() }),
      snippet: z.object({ title: z.string(), channelTitle: z.string(), publishedAt: z.string() }),
    }),
  ),
});

// YouTube escapes titles as HTML; React escapes again when rendering, so turn them back to text
const ENTITIES: Record<string, string> = { amp: "&", quot: '"', "#39": "'", lt: "<", gt: ">" };
const unescape = (text: string) =>
  text.replace(/&(amp|quot|#39|lt|gt);/g, (_, e: string) => ENTITIES[e] ?? e);

/** YouTube's answer as hits; anything that is not a playable video id is dropped. */
export function toHits(body: unknown, kind: Kind): Hit[] {
  return answer.parse(body).items.flatMap(({ id, snippet }) =>
    id.videoId
      ? [
          {
            youtube_id: id.videoId,
            kind,
            title: unescape(snippet.title),
            author: unescape(snippet.channelTitle),
            created_at: snippet.publishedAt,
          },
        ]
      : [],
  );
}

/** Ask our Worker (it holds the key and caches answers) for YouTube videos matching q. */
export async function searchVideos(q: string, kind: Kind, signal?: AbortSignal): Promise<Hit[]> {
  const res = await fetch(`/api/search?${new URLSearchParams({ q, kind })}`, { signal });
  if (res.status === 503) throw new Error("ค้นหายังไม่เปิด (ยังไม่ได้ใส่คีย์ YouTube)");
  if (res.status === 429) throw new Error("ค้นหาถี่เกินไป รอสักครู่แล้วลองใหม่");
  if (!res.ok) throw new Error("ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง");
  return z.array(hit).parse(await res.json());
}
