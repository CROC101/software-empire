/// ฟีด: ไฟล์อัปโหลด · กระดานโพสต์ · ความคิดเห็น · ที่บันทึกไว้ (community รอบ 3)
/// การเขียนทุกอย่างผ่านฟังก์ชัน SQL ที่ตรวจกติกาเดิมของ csmju-nexus — ไฟล์นี้แปลงรูปร่างข้อมูลกับเซ็น URL
import type { Database } from "@empire/core/supabase";
import { db } from "@/lib/supabase";
import {
  ApiError,
  badRequest,
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
import { reactionSummaries } from "./chat-model";
import { bucketOf, purge, signedUrls, storageFailed } from "./storage";
import type {
  Bookmark,
  BookmarkCollection,
  BookmarkTarget,
  Post,
  PostComment,
  PostMedia,
} from "./types";

type AssetRow = Database["community"]["Tables"]["assets"]["Row"];
type PostRow = Database["community"]["Views"]["post_view"]["Row"];
type MediaRef = { assetId: string; kind: PostMedia["kind"]; mimeType: string; path: string };

// nexus: post media links live 5 minutes, download links 2 minutes
const MEDIA_TTL = 300;
const DOWNLOAD_TTL = 120;
// Supabase signed upload URLs are valid for two hours
const UPLOAD_TTL_MS = 2 * 60 * 60 * 1000;

const postId = (raw: string | undefined) => idParam(raw, "โพสต์นี้ อาจถูกลบไปแล้ว");
const assetId = (raw: string | undefined) => idParam(raw, "ไฟล์นี้");

// ── ไฟล์ ──────────────────────────────────────────────────────────────────

const toAsset = (row: AssetRow) => ({
  id: row.id,
  ownerCoreUserId: row.owner_id,
  bucket: row.bucket,
  fileName: row.file_name,
  mimeType: row.mime_type,
  kind: row.kind,
  // a string like nexus, whose sizes were BigInt
  sizeBytes: String(row.size_bytes),
  status: row.status,
  createdAt: row.created_at,
});

async function uploadIntent(raw: unknown) {
  const input = body<{ fileName: string; sizeBytes: number; bucket: string; contentType: string }>(
    raw,
  );
  const [intent] = check(
    await db().rpc("create_upload_intent", {
      file_name: input.fileName ?? "",
      size_bytes: Number(input.sizeBytes),
      bucket: input.bucket ?? "",
      content_type: input.contentType,
    }),
  );
  if (!intent) throw storageFailed();
  // RLS lets this through only while a PENDING row of yours names the path
  const { data: signed, error } = await bucketOf(input.bucket ?? "").createSignedUploadUrl(
    intent.path,
  );
  if (error) {
    ok(await db().from("assets").delete().eq("id", intent.id));
    throw storageFailed();
  }
  return {
    assetId: intent.id,
    uploadUrl: signed.signedUrl,
    uploadMethod: "PUT",
    // commit rejects bytes stored under any other type, so the browser must send exactly this
    uploadHeaders: { "content-type": intent.mime },
    expiresAt: new Date(Date.now() + UPLOAD_TTL_MS).toISOString(),
  };
}

async function commit(asset: string) {
  const row = check(await db().rpc("commit_asset", { asset }));
  if (row.status === "BLOCKED") {
    ok(await db().from("assets").delete().eq("id", asset));
    await purge([row.object_path]);
    throw badRequest(`ไฟล์ถูกปฏิเสธ: ${row.blocked_reason ?? "ตรวจไม่ผ่าน"} — ไฟล์ถูกลบทิ้งแล้ว`);
  }
  return toAsset(row);
}

async function downloadUrl(asset: string) {
  const { data: row, error } = await db()
    .from("assets")
    .select("bucket,object_path,file_name,kind,status")
    .eq("id", asset)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (row?.status !== "READY") throw notFound("ไฟล์นี้");
  // anything a browser could render as a page downloads instead
  const asAttachment = !["IMAGE", "VIDEO", "AUDIO"].includes(row.kind);
  const { data: signed, error: signError } = await bucketOf(row.bucket).createSignedUrl(
    row.object_path,
    DOWNLOAD_TTL,
    asAttachment ? { download: row.file_name } : undefined,
  );
  if (signError) throw new ApiError(403, "FORBIDDEN", "ไม่มีสิทธิ์เข้าถึงไฟล์นี้");
  return {
    downloadUrl: signed.signedUrl,
    expiresAt: new Date(Date.now() + DOWNLOAD_TTL * 1000).toISOString(),
    asAttachment,
  };
}

async function listMyAssets(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("assets")
    .select("*", { count: "exact" })
    .eq("owner_id", await myId())
    .eq("status", "READY")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toAsset), meta: meta(page, limit, count ?? 0) };
}

async function deleteAsset(asset: string) {
  await purge([check(await db().rpc("delete_asset", { asset }))]);
  return {};
}

// ── โพสต์ ─────────────────────────────────────────────────────────────────

async function present(rows: PostRow[]): Promise<Post[]> {
  const refs = new Map(rows.map((row) => [row.id ?? "", (row.media ?? []) as MediaRef[]]));
  const [urls, summaries] = await Promise.all([
    signedUrls(
      "attachments",
      [...refs.values()].flat().map((ref) => ref.path),
      MEDIA_TTL,
    ),
    reactionSummaries("POST", [...refs.keys()]),
  ]);
  const reactions = new Map(summaries.map((summary) => [summary.targetId, summary]));
  return rows.map((row) => {
    const id = row.id ?? "";
    return {
      id,
      title: row.title ?? "",
      content: row.content ?? "",
      courseTag: row.course_tag,
      authorCoreUserId: row.author_id ?? "",
      commentCount: row.comment_count ?? 0,
      reactions: reactions.get(id) ?? null,
      createdAt: row.created_at ?? "",
      canComment: row.can_comment ?? false,
      media: (refs.get(id) ?? []).flatMap((ref) => {
        const url = urls.get(ref.path);
        return url ? [{ assetId: ref.assetId, kind: ref.kind, url, mimeType: ref.mimeType }] : [];
      }),
    };
  });
}

async function listPosts(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const rawAuthor = query.get("authorCoreUserId");
  const author = rawAuthor ? userId(rawAuthor) : null;
  let request = db().from("post_view").select("*", { count: "exact" });
  if (author) {
    request = request.eq("author_id", author);
  } else if (query.get("feed") === "following") {
    const me = await myId();
    const follows = check(await db().from("follows").select("followee_id").eq("follower_id", me));
    // shortcut: the follow list travels in the URL; move this into an RPC past a few hundred follows
    request = request.in("author_id", [me, ...follows.map((row) => row.followee_id)]);
  }
  const tag = query.get("courseTag")?.trim();
  if (tag && !author) request = request.eq("course_tag", tag);
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: await present(rows), meta: meta(page, limit, count ?? 0) };
}

async function postOrThrow(id: string): Promise<Post> {
  const { data: row, error } = await db().from("post_view").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrest(error);
  // a post by someone who blocked you looks exactly like a deleted one
  if (!row) throw notFound("โพสต์นี้ อาจถูกลบไปแล้ว");
  const [post] = await present([row]);
  if (!post) throw notFound("โพสต์นี้ อาจถูกลบไปแล้ว");
  return post;
}

async function createPost(raw: unknown) {
  const input = body<{ title: string; content: string; courseTag: string; assetIds: string[] }>(
    raw,
  );
  const assets = (input.assetIds ?? []).map(assetId);
  const id = check(
    await db().rpc("create_post", {
      title: input.title,
      content: input.content,
      course_tag: input.courseTag,
      asset_ids: assets,
    }),
  );
  return postOrThrow(id);
}

async function deletePost(id: string) {
  await purge(check(await db().rpc("delete_post", { post: id })));
  return {};
}

const toComment = (row: {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}): PostComment => ({
  id: row.id,
  postId: row.post_id,
  authorCoreUserId: row.author_id,
  content: row.content,
  createdAt: row.created_at,
});

async function listComments(post: string, query: URLSearchParams) {
  const exists = check(await db().from("posts").select("id").eq("id", post));
  if (exists.length === 0) throw notFound("โพสต์นี้ อาจถูกลบไปแล้ว");
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("post_comments")
    .select("id,post_id,author_id,content,created_at", { count: "exact" })
    .eq("post_id", post)
    // a Q&A thread reads oldest first
    .order("created_at", { ascending: true })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toComment), meta: meta(page, limit, count ?? 0) };
}

async function addComment(post: string, raw: unknown) {
  const id = check(
    await db().rpc("add_comment", { post, body: body<{ content: string }>(raw).content ?? "" }),
  );
  const row = check(
    await db()
      .from("post_comments")
      .select("id,post_id,author_id,content,created_at")
      .eq("id", id)
      .single(),
  );
  return toComment(row);
}

// ── ที่บันทึกไว้ ──────────────────────────────────────────────────────────

type BookmarkRow = Database["community"]["Views"]["bookmark_view"]["Row"];

const toBookmark = (row: BookmarkRow): Bookmark => ({
  targetKind: (row.target_kind ?? "POST") as BookmarkTarget,
  targetId: row.target_id ?? "",
  title: row.title,
  authorCoreUserId: row.author_id,
  createdAt: row.created_at ?? "",
});

function targetKind(kind: string | null | undefined): BookmarkTarget {
  if (kind !== "POST" && kind !== "REEL") throw badRequest("targetKind ต้องเป็น POST หรือ REEL");
  return kind;
}

const target = (kind: string | null | undefined, id: string | null | undefined) => ({
  target_kind: targetKind(kind),
  target_id: idParam(id ?? undefined, "สิ่งที่บันทึกไว้"),
});

async function listBookmarks(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const raw = query.get("targetKind");
  const kind = raw ? targetKind(raw) : null;
  let request = db().from("bookmark_view").select("*", { count: "exact" });
  if (kind) request = request.eq("target_kind", kind);
  const {
    data: rows,
    error,
    count,
  } = await request.order("created_at", { ascending: false }).range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toBookmark), meta: meta(page, limit, count ?? 0) };
}

async function bookmarkOf(ref: ReturnType<typeof target>): Promise<Bookmark> {
  const row = check(
    await db()
      .from("bookmark_view")
      .select("*")
      .eq("target_kind", ref.target_kind)
      .eq("target_id", ref.target_id)
      .single(),
  );
  return toBookmark(row);
}

async function addBookmark(raw: unknown) {
  const input = body<{ targetKind: string; targetId: string }>(raw);
  const ref = target(input.targetKind, input.targetId);
  const { error } = await db().from("bookmarks").insert(ref);
  // saving twice is fine; something you can't see "doesn't exist"
  if (error && error.code !== "23505")
    throw error.code === "42501" ? notFound("สิ่งที่จะบันทึก") : fromPostgrest(error);
  return bookmarkOf(ref);
}

async function removeBookmark(query: URLSearchParams) {
  const ref = target(query.get("targetKind"), query.get("targetId"));
  ok(
    await db()
      .from("bookmarks")
      .delete()
      .eq("target_kind", ref.target_kind)
      .eq("target_id", ref.target_id),
  );
  return {};
}

type CollectionRow = Database["community"]["Views"]["bookmark_collection_view"]["Row"];

const toCollection = (row: CollectionRow): BookmarkCollection => ({
  id: row.id ?? "",
  name: row.name ?? "",
  itemCount: row.item_count ?? 0,
  cover: row.cover as BookmarkCollection["cover"],
  createdAt: row.created_at ?? "",
  updatedAt: row.updated_at ?? "",
});

const collectionId = (raw: string | undefined) => idParam(raw, "คอลเลกชันนี้");

async function collectionOrThrow(id: string): Promise<BookmarkCollection> {
  const { data: row, error } = await db()
    .from("bookmark_collection_view")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!row) throw notFound("คอลเลกชันนี้");
  return toCollection(row);
}

async function listCollections(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("bookmark_collection_view")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toCollection), meta: meta(page, limit, count ?? 0) };
}

const notSavedYet = () => badRequest("ใส่ได้เฉพาะของที่บันทึกไว้แล้ว — กดบันทึกก่อน");

async function insertItems(collection: string, refs: ReturnType<typeof target>[]) {
  if (refs.length === 0) return;
  const { error } = await db()
    .from("bookmark_collection_items")
    .upsert(
      refs.map((ref) => ({ collection_id: collection, ...ref })),
      { ignoreDuplicates: true },
    );
  if (error) throw error.code === "23503" ? notSavedYet() : fromPostgrest(error);
}

async function createCollection(raw: unknown) {
  const input = body<{ name: string; items: { targetKind: string; targetId: string }[] }>(raw);
  const refs = (input.items ?? [])
    .slice(0, 100)
    .map((item) => target(item.targetKind, item.targetId));
  const { id } = check(
    await db()
      .from("bookmark_collections")
      .insert({ name: input.name?.trim() ?? "" })
      .select("id")
      .single(),
  );
  try {
    await insertItems(id, refs);
  } catch (error) {
    ok(await db().from("bookmark_collections").delete().eq("id", id));
    throw error;
  }
  return collectionOrThrow(id);
}

async function renameCollection(id: string, raw: unknown) {
  ok(
    await db()
      .from("bookmark_collections")
      .update({ name: body<{ name: string }>(raw).name?.trim() ?? "" })
      .eq("id", id),
  );
  return collectionOrThrow(id);
}

async function collectionItems(id: string, query: URLSearchParams) {
  await collectionOrThrow(id);
  const { page, limit, from, to } = paging(query);
  const {
    data: items,
    error,
    count,
  } = await db()
    .from("bookmark_collection_items")
    .select("target_kind,target_id", { count: "exact" })
    .eq("collection_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const saved = check(
    await db()
      .from("bookmark_view")
      .select("*")
      .in(
        "target_id",
        items.map((item) => item.target_id),
      ),
  );
  const byKey = new Map(saved.map((row) => [`${row.target_kind}:${row.target_id}`, row]));
  return {
    data: items.flatMap((item) => {
      const row = byKey.get(`${item.target_kind}:${item.target_id}`);
      return row ? [toBookmark(row)] : [];
    }),
    meta: meta(page, limit, count ?? 0),
  };
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

const path = (pattern: string) => new RegExp(`^${pattern}$`);
const P = "/posts/([^/]+)";
const COLLECTION = "/bookmark-collections/([^/]+)";

export const FEED_ROUTES: Route[] = [
  ["GET", path("/assets"), ({ query }) => listMyAssets(query)],
  ["POST", path("/assets/upload-intents"), ({ body: raw }) => data(uploadIntent(raw))],
  ["POST", path("/assets/([^/]+)/commit"), ({ params: [a] }) => data(commit(assetId(a)))],
  ["GET", path("/assets/([^/]+)/download-url"), ({ params: [a] }) => data(downloadUrl(assetId(a)))],
  ["DELETE", path("/assets/([^/]+)"), ({ params: [a] }) => data(deleteAsset(assetId(a)))],

  ["GET", path("/posts"), ({ query }) => listPosts(query)],
  ["POST", path("/posts"), ({ body: raw }) => data(createPost(raw))],
  ["GET", path(P), ({ params: [p] }) => data(postOrThrow(postId(p)))],
  ["DELETE", path(P), ({ params: [p] }) => data(deletePost(postId(p)))],
  ["GET", path(`${P}/comments`), ({ params: [p], query }) => listComments(postId(p), query)],
  ["POST", path(`${P}/comments`), ({ params: [p], body: raw }) => data(addComment(postId(p), raw))],
  [
    "DELETE",
    path(`${P}/comments/([^/]+)`),
    async ({ params: [p, c] }) => {
      const ids = { post: postId(p), comment: idParam(c, "ความคิดเห็นนี้") };
      ok(await db().rpc("delete_comment", ids));
      return { data: {} };
    },
  ],

  ["GET", path("/bookmarks"), ({ query }) => listBookmarks(query)],
  ["POST", path("/bookmarks"), ({ body: raw }) => data(addBookmark(raw))],
  ["DELETE", path("/bookmarks"), ({ query }) => data(removeBookmark(query))],
  ["GET", path("/bookmark-collections"), ({ query }) => listCollections(query)],
  ["POST", path("/bookmark-collections"), ({ body: raw }) => data(createCollection(raw))],
  [
    "PATCH",
    path(COLLECTION),
    ({ params: [c], body: raw }) => data(renameCollection(collectionId(c), raw)),
  ],
  [
    "DELETE",
    path(COLLECTION),
    async ({ params: [c] }) => {
      const id = collectionId(c);
      ok(await db().from("bookmark_collections").delete().eq("id", id));
      return { data: {} };
    },
  ],
  [
    "GET",
    path(`${COLLECTION}/items`),
    ({ params: [c], query }) => collectionItems(collectionId(c), query),
  ],
  [
    "POST",
    path(`${COLLECTION}/items`),
    async ({ params: [c], body: raw }) => {
      const id = collectionId(c);
      await collectionOrThrow(id);
      const input = body<{ targetKind: string; targetId: string }>(raw);
      await insertItems(id, [target(input.targetKind, input.targetId)]);
      return { data: {} };
    },
  ],
  [
    "DELETE",
    path(`${COLLECTION}/items`),
    async ({ params: [c], query }) => {
      const id = collectionId(c);
      const ref = target(query.get("targetKind"), query.get("targetId"));
      ok(
        await db()
          .from("bookmark_collection_items")
          .delete()
          .eq("collection_id", id)
          .eq("target_kind", ref.target_kind)
          .eq("target_id", ref.target_id),
      );
      return { data: {} };
    },
  ],
];
