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

// YouTube's own search filters; anything unknown in the URL falls back to "any"
export const ORDERS = ["relevance", "date", "viewCount", "rating"] as const;
export const WHENS = ["any", "hour", "today", "week", "month", "year"] as const;
export const LENGTHS = ["any", "short", "medium", "long"] as const;

export const filters = z.object({
  order: z.enum(ORDERS).catch("relevance"),
  when: z.enum(WHENS).catch("any"),
  length: z.enum(LENGTHS).catch("any"),
});
export type Filters = z.infer<typeof filters>;

export const searchQuery = filters.extend({
  q: z.string().trim().min(1).max(100),
  kind: z.enum(KINDS).catch("video"),
  // YouTube's nextPageToken, passed back as is
  page: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,100}$/)
    .optional()
    .catch(undefined),
});
export type SearchQuery = z.infer<typeof searchQuery>;

const HOUR = 3_600_000;
const AGO: Record<Exclude<Filters["when"], "any">, number> = {
  hour: HOUR,
  today: 24 * HOUR,
  week: 7 * 24 * HOUR,
  month: 30 * 24 * HOUR,
  year: 365 * 24 * HOUR,
};

// what each mode asks YouTube for; safeSearch strict everywhere (Tube is a grid, not adult content)
const BY_KIND: Record<Kind, Record<string, string>> = {
  video: {},
  movie: { videoDuration: "long" },
  music: { videoCategoryId: "10" },
  short: { videoDuration: "short" },
};

/** The YouTube Data API v3 search.list URL for one mode; only embeddable videos come back. */
export function searchUrl(s: SearchQuery, key: string, now = Date.now()): URL {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  const params = {
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "strict",
    maxResults: "50",
    order: s.order,
    q: s.kind === "short" ? `${s.q} #shorts` : s.q,
    key,
    ...(s.when !== "any" && { publishedAfter: new Date(now - AGO[s.when]).toISOString() }),
    ...(s.length !== "any" && { videoDuration: s.length }),
    ...(s.page && { pageToken: s.page }),
    // movies stay long and shorts stay short, whatever the length filter says
    ...BY_KIND[s.kind],
  };
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  return url;
}

const answer = z.object({
  nextPageToken: z.string().optional(),
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

const page = z.object({ hits: z.array(hit), next: z.string().nullable() });
export type Page = z.infer<typeof page>;

/** YouTube's answer as hits; anything that is not a playable video id is dropped. */
export function toPage(body: unknown, kind: Kind): Page {
  const { items, nextPageToken } = answer.parse(body);
  const hits = items.flatMap(({ id, snippet }) =>
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
  return { hits, next: nextPageToken ?? null };
}

/** A new order every time, so the same search never looks the same twice (Fisher-Yates). */
export function shuffle<T>(list: readonly T[], random = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Ask our Worker (it holds the key and caches answers) for one page of YouTube results. */
export async function searchPage(
  s: { q: string; kind: Kind; page?: string | null } & Partial<Filters>,
  signal?: AbortSignal,
): Promise<Page> {
  const params = new URLSearchParams({ q: s.q, kind: s.kind });
  for (const name of ["order", "when", "length", "page"] as const) {
    const value = s[name];
    if (value) params.set(name, value);
  }
  const res = await fetch(`/api/search?${params}`, { signal });
  if (res.status === 503) throw new Error("ค้นหายังไม่เปิด (ยังไม่ได้ใส่คีย์ YouTube)");
  if (res.status === 429) throw new Error("ค้นหาถี่เกินไป รอสักครู่แล้วลองใหม่");
  if (!res.ok) throw new Error("ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง");
  return page.parse(await res.json());
}

/** The first page only, shuffled: shelves that should feel fresh on every visit. */
export async function searchVideos(q: string, kind: Kind, signal?: AbortSignal): Promise<Hit[]> {
  return shuffle((await searchPage({ q, kind }, signal)).hits);
}
