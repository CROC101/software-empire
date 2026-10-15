/// "กิจกรรมของคุณ" — ของที่ผู้เรียกกดถูกใจ คอมเมนต์ รีโพสต์ ตอบสตอรี่ โพสต์เอง และประวัติบัญชี (community รอบ 5)
/// ทุกคิวรีผูกกับผู้เรียก (RLS + view ที่กรองด้วย auth.uid()) — ไม่มีพารามิเตอร์ให้ดูกิจกรรมของคนอื่น
import { db } from "@/lib/supabase";
import {
  badRequest,
  check,
  fromPostgrest,
  meta,
  myId,
  paging,
  type Route,
  userId,
} from "./api-core";
import { reactionSummaries } from "./chat-model";
import { resolveEmbeds } from "./embeds";
import { toReel } from "./reels-api";
import { signedUrls } from "./storage";
import type {
  AccountHistoryItem,
  AccountHistoryKind,
  LikedReel,
  MyComment,
  MyMedia,
  MyStoryReply,
  ReactedPost,
  RepostedReel,
} from "./types";

const THUMBNAIL_TTL = 300;
const DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2}))?$/;
const BANGKOK_MS = 7 * 3600_000;

/** A whole Bangkok calendar day (UTC+7, no DST) from `YYYY-MM-DD` or a full timestamp. */
function bangkokDay(raw: string, field: string): number {
  if (!DATE.test(raw)) throw badRequest(`${field} ต้องเป็นวันที่แบบ YYYY-MM-DD`);
  if (raw.length === 10) {
    const midnight = Date.parse(`${raw}T00:00:00+07:00`);
    // 2026-02-31 parses as March 3rd — reject dates that don't round-trip
    if (
      Number.isNaN(midnight) ||
      new Date(midnight + BANGKOK_MS).toISOString().slice(0, 10) !== raw
    )
      throw badRequest(`${field} ไม่ใช่วันที่ที่มีอยู่จริง`);
    return midnight;
  }
  const at = Date.parse(raw);
  if (Number.isNaN(at)) throw badRequest(`${field} ไม่ใช่วันที่ที่มีอยู่จริง`);
  const day = new Date(at + BANGKOK_MS).toISOString().slice(0, 10);
  return Date.parse(`${day}T00:00:00+07:00`);
}

/** Filters shared by every list: order, Bangkok day range, and the target's author. */
function filters(query: URLSearchParams) {
  const order = query.get("order") ?? "newest";
  if (order !== "newest" && order !== "oldest")
    throw badRequest("order ต้องเป็น newest หรือ oldest");
  const from = query.get("from");
  const to = query.get("to");
  const gte = from ? bangkokDay(from, "from") : null;
  const lt = to ? bangkokDay(to, "to") + 86_400_000 : null;
  if (gte !== null && lt !== null && gte >= lt) throw badRequest("from ต้องไม่อยู่หลัง to");
  const author = query.get("authorCoreUserId");
  return {
    ascending: order === "oldest",
    gte: gte === null ? null : new Date(gte).toISOString(),
    lt: lt === null ? null : new Date(lt).toISOString(),
    author: author ? userId(author) : null,
  };
}

type Range = ReturnType<typeof filters>;

// a PostgREST builder narrowed to the two calls we make on it
function inRange<T extends { gte(c: string, v: string): T; lt(c: string, v: string): T }>(
  request: T,
  column: string,
  range: Range,
): T {
  let r = request;
  if (range.gte) r = r.gte(column, range.gte);
  if (range.lt) r = r.lt(column, range.lt);
  return r;
}

/** Reel ids by one author — the filter for "only things by this person". */
async function reelsBy(author: string): Promise<string[]> {
  const rows = check(await db().from("reels").select("id").eq("author_id", author));
  return rows.map((row) => row.id);
}

async function reelsAsItems<T extends { reel_id: string }>(rows: T[]) {
  const reels = check(
    await db()
      .from("reel_view")
      .select("*")
      .in(
        "id",
        rows.map((row) => row.reel_id),
      ),
  );
  const urls = await signedUrls(
    "reels",
    reels.flatMap((reel) => (reel.video_path ? [reel.video_path] : [])),
    THUMBNAIL_TTL,
  );
  const byId = new Map(reels.map((reel) => [reel.id, reel]));
  return { byId, urls };
}

/** reel_likes or reel_reposts of the caller, as full reels plus when it happened. */
async function myReelRows(table: "reel_likes" | "reel_reposts", query: URLSearchParams) {
  const range = filters(query);
  const { page, limit, from, to } = paging(query);
  let request = inRange(
    db()
      .from(table)
      .select("reel_id,created_at", { count: "exact" })
      .eq("user_id", await myId()),
    "created_at",
    range,
  );
  if (range.author) request = request.in("reel_id", await reelsBy(range.author));
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: range.ascending })
    .order("reel_id", { ascending: range.ascending })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const { byId, urls } = await reelsAsItems(rows);
  const items = rows.flatMap((row) => {
    const reel = byId.get(row.reel_id);
    if (!reel) return [];
    return [
      {
        ...toReel(reel),
        targetKind: "REEL" as const,
        at: row.created_at,
        thumbnailUrl: reel.video_path ? (urls.get(reel.video_path) ?? null) : null,
      },
    ];
  });
  return { items, meta: meta(page, limit, count ?? 0) };
}

async function likes(query: URLSearchParams) {
  const target = query.get("target") ?? "REEL";
  if (target === "REEL") {
    const { items, meta: m } = await myReelRows("reel_likes", query);
    return {
      data: items.map(({ at, ...reel }): LikedReel => ({ ...reel, likedAt: at })),
      meta: m,
    };
  }
  if (target !== "POST") throw badRequest("target ต้องเป็น REEL หรือ POST");

  const range = filters(query);
  const { page, limit, from, to } = paging(query);
  let request = inRange(
    db().from("my_post_reactions").select("*", { count: "exact" }),
    "reacted_at",
    range,
  );
  if (range.author) request = request.eq("author_id", range.author);
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("reacted_at", { ascending: range.ascending })
    .order("post_id", { ascending: range.ascending })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const firsts = rows.map(
    (row) => ((row.media ?? []) as { kind: "IMAGE" | "VIDEO"; path: string }[])[0],
  );
  const urls = await signedUrls(
    "attachments",
    firsts.flatMap((first) => (first ? [first.path] : [])),
    THUMBNAIL_TTL,
  );
  return {
    data: rows.map((row, i): ReactedPost => {
      const first = firsts[i];
      return {
        targetKind: "POST",
        id: row.post_id ?? "",
        title: row.title ?? "",
        preview: (row.content ?? "").slice(0, 160),
        authorCoreUserId: row.author_id ?? "",
        emoji: row.emoji ?? "",
        thumbnailUrl: first ? (urls.get(first.path) ?? null) : null,
        thumbnailKind: first?.kind ?? null,
        reactedAt: row.reacted_at ?? "",
      };
    }),
    meta: meta(page, limit, count ?? 0),
  };
}

async function reposts(query: URLSearchParams) {
  const { items, meta: m } = await myReelRows("reel_reposts", query);
  return {
    data: items.map(({ at, ...reel }): RepostedReel => ({ ...reel, repostedAt: at })),
    meta: m,
  };
}

async function comments(query: URLSearchParams) {
  const range = filters(query);
  const { page, limit, from, to } = paging(query);
  let request = inRange(
    db().from("my_comments").select("*", { count: "exact" }),
    "created_at",
    range,
  );
  if (range.author) request = request.eq("target_author_id", range.author);
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: range.ascending })
    .order("id", { ascending: range.ascending })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return {
    data: rows.map((row): MyComment => ({
      id: row.id ?? "",
      targetKind: row.target_kind === "POST" ? "POST" : "REEL",
      targetId: row.target_id ?? "",
      targetTitle: row.target_title ?? "",
      targetAuthorCoreUserId: row.target_author_id ?? "",
      content: row.content ?? "",
      createdAt: row.created_at ?? "",
    })),
    meta: meta(page, limit, count ?? 0),
  };
}

async function storyReplies(query: URLSearchParams) {
  const range = filters(query);
  const { page, limit, from, to } = paging(query);
  let request = inRange(
    db()
      .from("message_view")
      .select("id,channel_id,content,embed_ref,story_reply_kind,story_reply_emoji,created_at", {
        count: "exact",
      })
      .eq("author_id", await myId())
      .eq("embed_kind", "STORY")
      .not("story_reply_kind", "is", null)
      .is("deleted_at", null),
    "created_at",
    range,
  );
  if (range.author) {
    const stories = check(await db().from("stories").select("id").eq("author_id", range.author));
    request = request.in(
      "embed_ref",
      stories.map((story) => story.id),
    );
  }
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: range.ascending })
    .order("id", { ascending: range.ascending })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const cards = await resolveEmbeds(
    rows.flatMap((row) => (row.embed_ref ? [{ kind: "STORY", refId: row.embed_ref }] : [])),
  );
  return {
    data: rows.flatMap((row): MyStoryReply[] => {
      const story = cards.get(`STORY:${row.embed_ref ?? ""}`);
      if (!story || !row.id || !row.channel_id || !row.embed_ref) return [];
      return [
        {
          id: row.id,
          channelId: row.channel_id,
          storyId: row.embed_ref,
          storyAuthorCoreUserId: story.authorCoreUserId ?? null,
          kind: row.story_reply_kind === "REACTION" ? "REACTION" : "REPLY",
          emoji: row.story_reply_emoji,
          content: row.content,
          story,
          createdAt: row.created_at ?? "",
        },
      ];
    }),
    meta: meta(page, limit, count ?? 0),
  };
}

async function media(query: URLSearchParams) {
  const kind = query.get("kind") ?? "REEL";
  if (kind !== "REEL" && kind !== "POST") throw badRequest("kind ต้องเป็น REEL หรือ POST");
  const range = filters(query);
  const { page, limit, from, to } = paging(query);
  const me = await myId();

  if (kind === "REEL") {
    const {
      data: rows,
      error,
      count,
    } = await inRange(
      db().from("reel_view").select("*", { count: "exact" }).eq("author_id", me),
      "created_at",
      range,
    )
      .order("created_at", { ascending: range.ascending })
      .order("id", { ascending: range.ascending })
      .range(from, to);
    if (error) throw fromPostgrest(error);
    const urls = await signedUrls(
      "reels",
      rows.flatMap((row) => (row.video_path ? [row.video_path] : [])),
      THUMBNAIL_TTL,
    );
    return {
      data: rows.map((row): MyMedia => ({
        targetKind: "REEL",
        id: row.id ?? "",
        title: row.title ?? "",
        preview: row.caption,
        thumbnailUrl: row.video_path ? (urls.get(row.video_path) ?? null) : null,
        thumbnailKind: "VIDEO",
        likeCount: row.like_count ?? 0,
        commentCount: row.comment_count ?? 0,
        viewCount: row.view_count ?? 0,
        createdAt: row.created_at ?? "",
      })),
      meta: meta(page, limit, count ?? 0),
    };
  }

  const {
    data: rows,
    error,
    count,
  } = await inRange(
    db().from("post_view").select("*", { count: "exact" }).eq("author_id", me),
    "created_at",
    range,
  )
    .order("created_at", { ascending: range.ascending })
    .order("id", { ascending: range.ascending })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const firsts = rows.map(
    (row) => ((row.media ?? []) as { kind: "IMAGE" | "VIDEO"; path: string }[])[0],
  );
  const [urls, summaries] = await Promise.all([
    signedUrls(
      "attachments",
      firsts.flatMap((first) => (first ? [first.path] : [])),
      THUMBNAIL_TTL,
    ),
    reactionSummaries(
      "POST",
      rows.map((row) => row.id ?? ""),
    ),
  ]);
  const reactions = new Map(summaries.map((s) => [s.targetId, s.totalCount]));
  return {
    data: rows.map((row, i): MyMedia => {
      const first = firsts[i];
      return {
        targetKind: "POST",
        id: row.id ?? "",
        title: row.title ?? "",
        preview: (row.content ?? "").slice(0, 160) || null,
        thumbnailUrl: first ? (urls.get(first.path) ?? null) : null,
        thumbnailKind: first?.kind ?? null,
        likeCount: reactions.get(row.id ?? "") ?? 0,
        commentCount: row.comment_count ?? 0,
        viewCount: null,
        createdAt: row.created_at ?? "",
      };
    }),
    meta: meta(page, limit, count ?? 0),
  };
}

// ── ประวัติบัญชี ─────────────────────────────────────────────────────────

const PROFILE_ACTIONS = [
  "profile.bio_change",
  "profile.cover_change",
  "profile.website_change",
  "channel.create",
];

function historyItem(row: {
  id: string;
  action: string;
  metadata: unknown;
  created_at: string;
}): AccountHistoryItem {
  const m = (row.metadata ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  const item = (kind: AccountHistoryKind, detail: string | null = null): AccountHistoryItem => ({
    id: row.id,
    kind,
    detail,
    createdAt: row.created_at,
  });
  switch (row.action) {
    case "profile.bio_change":
      return text(m.new) ? item("BIO_CHANGED", text(m.new)) : item("BIO_REMOVED");
    case "profile.website_change":
      return item("WEBSITE_CHANGED", text(m.new));
    case "profile.cover_change":
      return item(m.removed === true ? "COVER_REMOVED" : "COVER_CHANGED");
    case "post.delete":
      return item("CONTENT_DELETED", "POST");
    case "reel.delete":
      return item("CONTENT_DELETED", "REEL");
    case "story.delete":
      return item("CONTENT_DELETED", "STORY");
    default:
      return item("ROOM_CREATED", text(m.name) ?? text(m.kind));
  }
}

/** Audit rows about my account, plus a synthetic JOINED row that is always the oldest. */
async function accountHistory(query: URLSearchParams) {
  const order = query.get("order") ?? "newest";
  if (order !== "newest" && order !== "oldest")
    throw badRequest("order ต้องเป็น newest หรือ oldest");
  const ascending = order === "oldest";
  const { page, limit, from } = paging(query);
  const me = await myId();

  const audited = () =>
    db()
      .from("audit_logs")
      .select("id,action,metadata,created_at", { count: "exact" })
      .eq("actor_id", me)
      // my own deletes only — a moderator removing my post shows up in their history, not mine
      .or(
        `action.in.(${PROFILE_ACTIONS.join(",")}),and(action.in.(post.delete,reel.delete,story.delete),metadata->>author_core_user_id.eq.${me})`,
      );

  // JOINED is index 0 when oldest-first, index total-1 when newest-first
  const auditFrom = ascending ? Math.max(from - 1, 0) : from;
  const auditTake = ascending && from === 0 ? limit - 1 : limit;
  const [{ data: rows, error, count }, profile] = await Promise.all([
    auditTake > 0
      ? audited()
          .order("created_at", { ascending })
          .order("id", { ascending })
          .range(auditFrom, auditFrom + auditTake - 1)
      : audited().limit(0),
    db().from("profiles").select("created_at").eq("user_id", me).maybeSingle(),
  ]);
  if (error) throw fromPostgrest(error);
  const audits = count ?? 0;
  const joined: AccountHistoryItem = {
    id: "joined",
    kind: "JOINED",
    detail: null,
    createdAt: profile.data?.created_at ?? new Date().toISOString(),
  };
  const items = rows.map(historyItem);
  if (ascending && from === 0) items.unshift(joined);
  if (!ascending && from + limit > audits && from <= audits) items.push(joined);
  return { data: items.slice(0, limit), meta: meta(page, limit, audits + 1) };
}

export const ACTIVITY_ROUTES: Route[] = [
  ["GET", /^\/activity\/likes$/, ({ query }) => likes(query)],
  ["GET", /^\/activity\/comments$/, ({ query }) => comments(query)],
  ["GET", /^\/activity\/reposts$/, ({ query }) => reposts(query)],
  ["GET", /^\/activity\/story-replies$/, ({ query }) => storyReplies(query)],
  ["GET", /^\/activity\/media$/, ({ query }) => media(query)],
  ["GET", /^\/activity\/account-history$/, ({ query }) => accountHistory(query)],
];
