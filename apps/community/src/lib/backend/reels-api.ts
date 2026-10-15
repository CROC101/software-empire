/// คลิปสั้น: ฟีด · ไลก์ · รีโพสต์ · ยอดวิว · ความคิดเห็นแบบตอบกลับชั้นเดียว (community รอบ 4)
/// ตัวนับขยับได้เฉพาะในฟังก์ชัน SQL — ไฟล์นี้แปลงรูปร่างข้อมูล ส่วนวิดีโอเปิดผ่าน /assets/:id/download-url
import type { Database } from "@empire/core/supabase";
import { db } from "@/lib/supabase";
import {
  body,
  check,
  data,
  fromPostgrest,
  idParam,
  meta,
  myId,
  notFound,
  ok,
  paging,
  type Route,
  userId,
} from "./api-core";
import { purge } from "./storage";
import type { CommentLike, Reel, ReelComment, RepostState } from "./types";

type ReelRow = Database["community"]["Views"]["reel_view"]["Row"];
type CommentRow = Database["community"]["Views"]["reel_comment_view"]["Row"];

const reelId = (raw: string | undefined) => idParam(raw, "คลิปนี้ อาจถูกลบไปแล้ว");
const commentId = (raw: string | undefined) => idParam(raw, "ความคิดเห็นนี้");

export const toReel = (row: ReelRow): Reel => ({
  id: row.id ?? "",
  title: row.title ?? "",
  caption: row.caption,
  assetId: row.asset_id ?? "",
  durationMs: row.duration_ms ?? 0,
  authorCoreUserId: row.author_id ?? "",
  likeCount: row.like_count ?? 0,
  viewCount: row.view_count ?? 0,
  likedByMe: row.liked_by_me ?? false,
  commentCount: row.comment_count ?? 0,
  repostCount: row.repost_count ?? 0,
  repostedByMe: row.reposted_by_me ?? false,
  canComment: row.can_comment ?? false,
  createdAt: row.created_at ?? "",
});

const toComment = (row: CommentRow): ReelComment => ({
  id: row.id ?? "",
  reelId: row.reel_id ?? "",
  authorCoreUserId: row.author_id ?? "",
  content: row.content ?? "",
  parentId: row.parent_id,
  replyCount: row.reply_count ?? 0,
  likeCount: row.like_count ?? 0,
  likedByMe: row.liked_by_me ?? false,
  createdAt: row.created_at ?? "",
});

async function listReels(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const rawAuthor = query.get("authorCoreUserId");
  const author = rawAuthor ? userId(rawAuthor) : null;
  let request = db().from("reel_view").select("*", { count: "exact" });
  if (author) {
    request = request.eq("author_id", author);
  } else if (query.get("feed") === "following") {
    const me = await myId();
    const follows = check(await db().from("follows").select("followee_id").eq("follower_id", me));
    // shortcut: the follow list travels in the URL; move this into an RPC past a few hundred follows
    request = request.in("author_id", [me, ...follows.map((row) => row.followee_id)]);
  }
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toReel), meta: meta(page, limit, count ?? 0) };
}

async function reelOrThrow(id: string): Promise<Reel> {
  const { data: row, error } = await db().from("reel_view").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrest(error);
  // a reel by someone who blocked you looks exactly like a deleted one
  if (!row) throw notFound("คลิปนี้ อาจถูกลบไปแล้ว");
  return toReel(row);
}

async function createReel(raw: unknown) {
  const input = body<{ title: string; caption: string; assetId: string; durationMs: number }>(raw);
  const asset = idParam(input.assetId, "ไฟล์ที่อ้างถึง — อัปโหลดให้เสร็จก่อน");
  const id = check(
    await db().rpc("create_reel", {
      title: input.title ?? "",
      caption: input.caption,
      asset,
      duration_ms: Math.round(Number(input.durationMs)),
    }),
  );
  return reelOrThrow(id);
}

/** Profile "reposts" tab: reels this person reposted, newest repost first. */
async function repostsOf(user: string, query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("reel_reposts")
    .select("reel_id", { count: "exact" })
    .eq("user_id", user)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const reels = check(
    await db()
      .from("reel_view")
      .select("*")
      .in(
        "id",
        rows.map((row) => row.reel_id),
      ),
  );
  const byId = new Map(reels.map((row) => [row.id, row]));
  return {
    data: rows.flatMap((row) => {
      const reel = byId.get(row.reel_id);
      return reel ? [toReel(reel)] : [];
    }),
    meta: meta(page, limit, count ?? 0),
  };
}

async function listComments(reel: string, query: URLSearchParams) {
  const rawParent = query.get("parentId");
  const parent = rawParent ? commentId(rawParent) : null;
  await reelOrThrow(reel);
  const { page, limit, from, to } = paging(query);
  let request = db().from("reel_comment_view").select("*", { count: "exact" }).eq("reel_id", reel);
  // top level: newest first · a thread: oldest first, read as a conversation
  request = parent ? request.eq("parent_id", parent) : request.is("parent_id", null);
  const {
    data: rows,
    error,
    count,
  } = await request.order("created_at", { ascending: Boolean(parent) }).range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toComment), meta: meta(page, limit, count ?? 0) };
}

async function addComment(reel: string, raw: unknown) {
  const input = body<{ content: string; parentId: string }>(raw);
  const parent = input.parentId ? commentId(input.parentId) : undefined;
  const id = check(await db().rpc("add_reel_comment", { reel, body: input.content ?? "", parent }));
  return toComment(check(await db().from("reel_comment_view").select("*").eq("id", id).single()));
}

const likeRoute = (liked: boolean): Route => [
  liked ? "POST" : "DELETE",
  /^\/reels\/([^/]+)\/likes$/,
  async ({ params: [r] }) => {
    const reel = reelId(r);
    return { data: { likeCount: check(await db().rpc("like_reel", { reel, liked })) } };
  },
];

const repostRoute = (reposted: boolean): Route => [
  reposted ? "POST" : "DELETE",
  /^\/reels\/([^/]+)\/reposts$/,
  async ({ params: [r] }) => {
    const reel = reelId(r);
    const repostCount = check(await db().rpc("repost_reel", { reel, reposted }));
    return { data: { repostCount, repostedByMe: reposted } satisfies RepostState };
  },
];

const commentLikeRoute = (liked: boolean): Route => [
  liked ? "POST" : "DELETE",
  /^\/reels\/([^/]+)\/comments\/([^/]+)\/likes$/,
  async ({ params: [r, c] }) => {
    reelId(r);
    const comment = commentId(c);
    const likeCount = check(await db().rpc("like_reel_comment", { comment, liked }));
    return { data: { likeCount, likedByMe: liked } satisfies CommentLike };
  },
];

export const REEL_ROUTES: Route[] = [
  ["GET", /^\/reels$/, ({ query }) => listReels(query)],
  ["POST", /^\/reels$/, ({ body: raw }) => data(createReel(raw))],
  ["GET", /^\/reels\/([^/]+)$/, ({ params: [r] }) => data(reelOrThrow(reelId(r)))],
  [
    "DELETE",
    /^\/reels\/([^/]+)$/,
    async ({ params: [r] }) => {
      const reel = reelId(r);
      await purge([check(await db().rpc("delete_reel", { reel }))]);
      return { data: {} };
    },
  ],
  likeRoute(true),
  likeRoute(false),
  repostRoute(true),
  repostRoute(false),
  [
    "POST",
    /^\/reels\/([^/]+)\/views$/,
    async ({ params: [r] }) => {
      const reel = reelId(r);
      return { data: { viewCount: check(await db().rpc("view_reel", { reel })) } };
    },
  ],
  [
    "GET",
    /^\/reels\/([^/]+)\/comments$/,
    ({ params: [r], query }) => listComments(reelId(r), query),
  ],
  [
    "POST",
    /^\/reels\/([^/]+)\/comments$/,
    ({ params: [r], body: raw }) => data(addComment(reelId(r), raw)),
  ],
  commentLikeRoute(true),
  commentLikeRoute(false),
  [
    "DELETE",
    /^\/reels\/([^/]+)\/comments\/([^/]+)$/,
    async ({ params: [r, c] }) => {
      reelId(r);
      const comment = commentId(c);
      ok(await db().rpc("delete_reel_comment", { comment }));
      return { data: {} };
    },
  ],
  [
    "GET",
    /^\/profiles\/([^/]+)\/reposts$/,
    ({ params: [u], query }) => repostsOf(userId(u), query),
  ],
];
