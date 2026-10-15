/// แปลงแถวแชทจากฐานข้อมูลเป็นรูปร่างที่หน้าจอเดิมของ csmju-nexus ใช้ — ใช้ร่วมกันระหว่าง chat-api กับ socket
import type { Database } from "@empire/core/supabase";
import { db } from "@/lib/supabase";
import { check, fromPostgrest } from "./api-core";
import { embedKey, resolveEmbeds } from "./embeds";
import type {
  Channel,
  Message,
  MessageAttachment,
  MessageEmbed,
  MessageReplyTo,
  ReactionSummary,
  ReactionTarget,
} from "./types";

type MessageRow = Database["community"]["Views"]["message_view"]["Row"];

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id ?? "",
    seq: row.seq ?? 0,
    channelId: row.channel_id ?? "",
    authorCoreUserId: row.author_id ?? "",
    content: row.content,
    attachments: (row.attachments ?? []) as unknown as MessageAttachment[],
    // filled in by toMessages, which resolves every card on the page in one go
    embed: null,
    parentId: row.parent_id,
    replyCount: row.reply_count ?? 0,
    pinnedAt: row.pinned_at,
    pinnedByCoreUserId: row.pinned_by,
    clientNonce: row.client_nonce ?? "",
    editedAt: row.edited_at,
    createdAt: row.created_at ?? "",
    replyTo: row.reply_to as MessageReplyTo | null,
    forwarded: row.forwarded ?? false,
    storyReply: row.story_reply_kind
      ? { kind: row.story_reply_kind as "REPLY" | "REACTION", emoji: row.story_reply_emoji }
      : null,
  };
}

/** Rows to messages, with shared post/reel/story cards resolved for the whole page. */
export async function toMessages(rows: MessageRow[]): Promise<Message[]> {
  const refs = rows.flatMap((row) =>
    row.embed_kind && row.embed_ref ? [{ kind: row.embed_kind, refId: row.embed_ref }] : [],
  );
  const cards = refs.length ? await resolveEmbeds(refs) : new Map<string, MessageEmbed>();
  return rows.map((row) => ({
    ...toMessage(row),
    embed:
      row.embed_kind && row.embed_ref
        ? (cards.get(embedKey(row.embed_kind, row.embed_ref)) ?? null)
        : null,
  }));
}

export async function fetchMessage(id: string): Promise<Message | null> {
  const { data, error } = await db().from("message_view").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrest(error);
  return data ? ((await toMessages([data]))[0] ?? null) : null;
}

/** One channel in the nexus inbox shape (null when it doesn't exist or you're not a member). */
export async function fetchChannel(id: string): Promise<Channel | null> {
  const rows = check(await db().rpc("channel_rows", { only_channel: id }));
  return (rows[0] as unknown as Channel | undefined) ?? null;
}

export async function reactionSummaries(
  kind: ReactionTarget,
  targetIds: string[],
): Promise<ReactionSummary[]> {
  if (targetIds.length === 0) return [];
  const rows = check(await db().rpc("reaction_summaries", { kind, targets: targetIds }));
  const byTarget = new Map<string, ReactionSummary>();
  for (const row of rows) {
    let summary = byTarget.get(row.target_id);
    if (!summary) {
      summary = { targetKind: kind, targetId: row.target_id, totals: [], totalCount: 0 };
      byTarget.set(row.target_id, summary);
    }
    // rows arrive in first-reacted order — chat chips keep that order (Discord style)
    summary.totals.push({ emoji: row.emoji, count: row.count, reactedByMe: row.reacted_by_me });
    summary.totalCount += row.count;
  }
  const all = [...byTarget.values()];
  // posts and reels list the most used emoji first
  if (kind !== "MESSAGE")
    for (const summary of all) summary.totals.sort((a, b) => b.count - a.count);
  return all;
}
