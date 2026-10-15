/// การ์ดของโพสต์/คลิป/สตอรี่ที่แชร์เข้าแชท — คำนวณตอนอ่าน ไม่ใช่ snapshot ตอนแชร์
/// เพราะของที่ถูกลบ หมดอายุ หรือบล็อกกันทีหลัง ต้องหายจากการ์ดด้วย (RLS ตัดสินว่าเห็นได้ไหม)
import { db } from "@/lib/supabase";
import { check } from "./api-core";
import { signedUrls } from "./storage";
import type { MessageEmbed } from "./types";

export type EmbedRef = { kind: string; refId: string };

// like nexus: card thumbnails live as long as story links
const THUMBNAIL_TTL = 300;

type Card = Omit<MessageEmbed, "thumbnailUrl"> & {
  path: string | null;
  bucket: "attachments" | "reels";
};

export const embedKey = (kind: string, refId: string) => `${kind}:${refId}`;

const preview = (text: string | null | undefined) => (text ? text.slice(0, 120) : null);

export async function resolveEmbeds(refs: EmbedRef[]): Promise<Map<string, MessageEmbed>> {
  const idsOf = (kind: string) => [
    ...new Set(refs.filter((ref) => ref.kind === kind).map((ref) => ref.refId)),
  ];
  const [postIds, reelIds, storyIds] = [idsOf("POST"), idsOf("REEL"), idsOf("STORY")];
  const none = Promise.resolve([]);
  const [posts, reels, stories] = await Promise.all([
    postIds.length
      ? db()
          .from("post_view")
          .select("id,author_id,title,content,media")
          .in("id", postIds)
          .then(check)
      : none,
    reelIds.length
      ? db()
          .from("reel_view")
          .select("id,author_id,title,caption,video_path")
          .in("id", reelIds)
          .then(check)
      : none,
    storyIds.length
      ? db()
          .from("story_feed")
          .select("id,author_id,caption,kind,path")
          .in("id", storyIds)
          .then(check)
      : none,
  ]);

  const cards: Card[] = [
    ...posts.map((p): Card => {
      const first = ((p.media ?? []) as { kind: "IMAGE" | "VIDEO"; path: string }[])[0];
      return {
        kind: "POST",
        refId: p.id ?? "",
        title: p.title || null,
        preview: preview(p.content),
        authorCoreUserId: p.author_id,
        thumbnailKind: first?.kind ?? null,
        path: first?.path ?? null,
        bucket: "attachments",
      };
    }),
    ...reels.map((r): Card => ({
      kind: "REEL",
      refId: r.id ?? "",
      title: r.title,
      preview: preview(r.caption),
      authorCoreUserId: r.author_id,
      thumbnailKind: "VIDEO",
      path: r.video_path,
      bucket: "reels",
    })),
    ...stories.map((s): Card => ({
      kind: "STORY",
      refId: s.id ?? "",
      title: null,
      preview: preview(s.caption),
      authorCoreUserId: s.author_id,
      thumbnailKind: s.kind === "VIDEO" ? "VIDEO" : "IMAGE",
      path: s.path,
      bucket: "attachments",
    })),
  ];

  const pathsIn = (bucket: Card["bucket"]) =>
    cards.flatMap((card) => (card.bucket === bucket && card.path ? [card.path] : []));
  const [attachmentUrls, reelUrls] = await Promise.all([
    signedUrls("attachments", pathsIn("attachments"), THUMBNAIL_TTL),
    signedUrls("reels", pathsIn("reels"), THUMBNAIL_TTL),
  ]);

  const out = new Map<string, MessageEmbed>();
  for (const { path, bucket, ...card } of cards) {
    const urls = bucket === "reels" ? reelUrls : attachmentUrls;
    out.set(embedKey(card.kind, card.refId), {
      ...card,
      targetId: card.refId,
      thumbnailUrl: path ? (urls.get(path) ?? null) : null,
      available: true,
    });
  }
  // deleted, expired or blocked: still a card, so the message doesn't vanish — it says "unavailable"
  for (const ref of refs) {
    const key = embedKey(ref.kind, ref.refId);
    if (!out.has(key))
      out.set(key, {
        kind: ref.kind,
        refId: ref.refId,
        targetId: ref.refId,
        authorCoreUserId: null,
        title: null,
        preview: null,
        thumbnailUrl: null,
        thumbnailKind: null,
        available: false,
      });
  }
  return out;
}
