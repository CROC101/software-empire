import { z } from "zod";
import { loadSupabase } from "./session";
import { oembedSchema, type Oembed } from "./youtube";

export const KINDS = ["video", "movie", "music", "short"] as const;
export type Kind = (typeof KINDS)[number];

const video = z.object({
  youtube_id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  kind: z.enum(KINDS),
  title: z.string(),
  author: z.string(),
  created_at: z.string(),
});
const mine = video.extend({ id: z.uuid() });
const progress = z.object({ youtube_id: z.string(), seconds: z.number(), duration: z.number() });

export type Video = z.infer<typeof video> & { id?: string };
export type Progress = z.infer<typeof progress>;

const db = async () => (await loadSupabase()).schema("stream");

const none = { data: [], error: null };

/** Featured shelves (everyone), the user's own library, and where they stopped in each video. */
export async function loadAll(signedIn: boolean) {
  const s = await db();
  const [featured, items, seen] = await Promise.all([
    s.from("featured").select("youtube_id, kind, title, author, created_at").order("position"),
    // visitors who are not signed in have no library (anon may not read these tables at all)
    !signedIn
      ? none
      : s
          .from("items")
          .select("id, youtube_id, kind, title, author, created_at")
          .order("created_at", {
            ascending: false,
          }),
    !signedIn
      ? none
      : s.from("progress").select("youtube_id, seconds, duration").order("updated_at", {
          ascending: false,
        }),
  ]);
  if (featured.error) throw featured.error;
  return {
    featured: z.array(video).parse(featured.data),
    mine: z.array(mine).parse(items.data ?? []),
    progress: z.array(progress).parse(seen.data ?? []),
  };
}

/** Title and channel from YouTube (through our Worker), so people only paste a link. */
export async function lookup(id: string): Promise<Oembed> {
  const res = await fetch(`/api/oembed?id=${encodeURIComponent(id)}`);
  if (!res.ok)
    throw new Error(
      res.status === 404 ? "ไม่พบคลิปนี้ หรือเจ้าของไม่อนุญาตให้ฝัง" : "ถาม YouTube ไม่สำเร็จ",
    );
  return oembedSchema.parse(await res.json());
}

export async function saveItem(item: { youtube_id: string; kind: Kind } & Oembed) {
  const s = await db();
  const { error } = await s
    .from("items")
    .upsert(item, { onConflict: "user_id,youtube_id", ignoreDuplicates: false });
  if (error) throw error;
}

export async function removeItem(id: string) {
  const { error } = await (await db()).from("items").delete().eq("id", id);
  if (error) throw error;
}

/** Autosave: one row per video, overwritten while it plays. */
export async function saveProgress(youtubeId: string, seconds: number, duration: number) {
  const { error } = await (
    await db()
  )
    .from("progress")
    .upsert(
      { youtube_id: youtubeId, seconds, duration, updated_at: new Date().toISOString() },
      { onConflict: "user_id,youtube_id" },
    );
  if (error) throw error;
}

/** Watch together: a room is a row; its id is the link. */
export async function openRoom(youtubeId: string) {
  const { data, error } = await (
    await db()
  )
    .from("rooms")
    .insert({ youtube_id: youtubeId })
    .select("id")
    .single();
  if (error) throw error;
  return z.uuid().parse(data.id);
}

export async function getRoom(id: string) {
  const { data, error } = await (
    await db()
  )
    .from("rooms")
    .select("id, host, youtube_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? z.object({ id: z.uuid(), host: z.uuid(), youtube_id: z.string() }).parse(data)
    : null;
}
