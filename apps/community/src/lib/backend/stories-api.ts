/// สตอรี่ 24 ชั่วโมง · ไฮไลต์บนโปรไฟล์ · โน้ตเหนือกล่องข้อความ (community รอบ 4)
/// ใครเห็นอะไรตัดสินใน RLS (can_see_story / can_see_note) — ไฟล์นี้จัดกลุ่ม เรียง และเซ็น URL
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
import { purge, signedUrls } from "./storage";
import type {
  DeliveryResult,
  HighlightDetail,
  HighlightSummary,
  Note,
  NoteAudience,
  StoryArchiveItem,
  StoryItem,
  StoryTray,
} from "./types";

type StoryRow = Database["community"]["Views"]["story_feed"]["Row"];
type HighlightRow = Database["community"]["Views"]["highlight_view"]["Row"];

// nexus: story links outlive a scroll through the feed, but not by much
const STORY_URL_TTL = 300;
// a tray is one screen, not every story ever posted
const TRAY_LIMIT = 300;

const storyId = (raw: string | undefined) => idParam(raw, "สตอรี่นี้");
const highlightId = (raw: string | undefined) => idParam(raw, "ไฮไลต์นี้ อาจถูกลบไปแล้ว");
const mediaKind = (kind: string | null) => (kind === "VIDEO" ? "VIDEO" : "IMAGE");

const sign = (paths: (string | null)[]) =>
  signedUrls(
    "attachments",
    paths.filter((path): path is string => Boolean(path)),
    STORY_URL_TTL,
  );

const toItem = (row: StoryRow, urls: Map<string, string>): StoryItem => ({
  id: row.id ?? "",
  authorCoreUserId: row.author_id ?? "",
  kind: mediaKind(row.kind),
  mediaUrl: urls.get(row.path ?? "") ?? "",
  assetId: row.asset_id ?? "",
  caption: row.caption,
  viewedByMe: row.viewed_by_me ?? false,
  viewCount: row.view_count ?? 0,
  createdAt: row.created_at ?? "",
  expiresAt: row.expires_at ?? "",
});

// ── สตอรี่ ────────────────────────────────────────────────────────────────

/** The row above the feed: mine first, then people with something unseen. */
async function tray(): Promise<StoryTray[]> {
  const me = await myId();
  const follows = check(await db().from("follows").select("followee_id").eq("follower_id", me));
  const rows = check(
    await db()
      .from("story_feed")
      .select("*")
      .in("author_id", [me, ...follows.map((row) => row.followee_id)])
      // expiry is enforced at read time, whether or not anything ever cleans up
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(TRAY_LIMIT),
  );
  const urls = await sign(rows.map((row) => row.path));
  const byAuthor = new Map<string, StoryItem[]>();
  for (const row of rows) {
    const author = row.author_id ?? "";
    byAuthor.set(author, [...(byAuthor.get(author) ?? []), toItem(row, urls)]);
  }
  return [...byAuthor.entries()]
    .map(([author, stories]) => ({
      authorCoreUserId: author,
      hasUnseen: stories.some((story) => !story.viewedByMe),
      isMe: author === me,
      stories,
    }))
    .sort((a, b) =>
      a.isMe !== b.isMe
        ? a.isMe
          ? -1
          : 1
        : a.hasUnseen !== b.hasUnseen
          ? a.hasUnseen
            ? -1
            : 1
          : a.authorCoreUserId.localeCompare(b.authorCoreUserId),
    );
}

async function storyOrThrow(id: string): Promise<StoryItem> {
  const { data: row, error } = await db().from("story_feed").select("*").eq("id", id).maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!row) throw notFound("สตอรี่นี้ หรือหมดอายุไปแล้ว");
  return toItem(row, await sign([row.path]));
}

async function archive(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("story_feed")
    .select("*", { count: "exact" })
    .eq("author_id", await myId())
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const urls = await sign(rows.map((row) => row.path));
  const now = Date.now();
  return {
    data: rows.map((row): StoryArchiveItem => ({
      id: row.id ?? "",
      assetId: row.asset_id ?? "",
      mediaKind: mediaKind(row.kind),
      mediaUrl: urls.get(row.path ?? "") ?? "",
      caption: row.caption,
      viewCount: row.view_count ?? 0,
      isExpired: Date.parse(row.expires_at ?? "") <= now,
      createdAt: row.created_at ?? "",
      expiresAt: row.expires_at ?? "",
    })),
    meta: meta(page, limit, count ?? 0),
  };
}

async function createStory(raw: unknown) {
  const input = body<{ assetId: string; caption: string }>(raw);
  const asset = idParam(input.assetId, "ไฟล์นี้");
  const id = check(await db().rpc("create_story", { asset, caption: input.caption }));
  return storyOrThrow(id);
}

async function reply(story: string, raw: unknown): Promise<DeliveryResult> {
  const input = body<{ content: string; emoji: string }>(raw);
  if ((input.content === undefined) === (input.emoji === undefined))
    throw badRequest("ส่ง content (พิมพ์ตอบ) หรือ emoji (กดอิโมจิ) อย่างใดอย่างหนึ่ง");
  const [sent] = check(
    await db().rpc("reply_story", { story, body: input.content, emoji: input.emoji }),
  );
  return { channelIds: sent ? [sent.channel] : [], messageIds: sent ? [sent.message] : [] };
}

/** Owner only — 404 when it doesn't exist, 403 when it isn't yours. */
async function requireOwnStory(story: string) {
  const { data: row, error } = await db()
    .from("stories")
    .select("author_id")
    .eq("id", story)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!row) throw notFound("สตอรี่นี้");
  if (row.author_id !== (await myId()))
    throw new ApiError(403, "FORBIDDEN", "ดูรายชื่อผู้ชมได้เฉพาะสตอรี่ของตัวเอง");
}

async function viewers(story: string, query: URLSearchParams) {
  await requireOwnStory(story);
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("story_views")
    .select("user_id,viewed_at", { count: "exact" })
    .eq("story_id", story)
    .order("viewed_at", { ascending: false })
    .order("user_id")
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return {
    data: rows.map((row) => ({ coreUserId: row.user_id, viewedAt: row.viewed_at })),
    meta: meta(page, limit, count ?? 0),
  };
}

// ── ไฮไลต์ ───────────────────────────────────────────────────────────────

const toSummary = (row: HighlightRow, urls: Map<string, string>): HighlightSummary => ({
  id: row.id ?? "",
  ownerCoreUserId: row.owner_id ?? "",
  title: row.title ?? "",
  coverStoryId: row.cover_story_id,
  coverMediaUrl: row.cover_path ? (urls.get(row.cover_path) ?? null) : null,
  coverMediaKind: row.cover_kind ? mediaKind(row.cover_kind) : null,
  itemCount: row.item_count ?? 0,
  createdAt: row.created_at ?? "",
  updatedAt: row.updated_at ?? "",
});

async function highlightsOf(owner: string): Promise<HighlightSummary[]> {
  const rows = check(
    await db()
      .from("highlight_view")
      .select("*")
      .eq("owner_id", owner)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(100),
  );
  const urls = await sign(rows.map((row) => row.cover_path));
  return rows.map((row) => toSummary(row, urls));
}

async function highlightDetail(id: string): Promise<HighlightDetail> {
  const { data: row, error } = await db()
    .from("highlight_view")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!row) throw notFound("ไฮไลต์นี้ อาจถูกลบไปแล้ว");
  const items = check(
    await db()
      .from("highlight_items")
      .select("story_id,position")
      .eq("highlight_id", id)
      .order("position"),
  );
  const stories = check(
    await db()
      .from("story_feed")
      .select("*")
      .in(
        "id",
        items.map((item) => item.story_id),
      ),
  );
  const urls = await sign([row.cover_path, ...stories.map((story) => story.path)]);
  const byId = new Map(stories.map((story) => [story.id, story]));
  return {
    ...toSummary(row, urls),
    items: items.flatMap((item) => {
      const story = byId.get(item.story_id);
      return story
        ? [
            {
              storyId: item.story_id,
              position: item.position,
              mediaKind: mediaKind(story.kind),
              mediaUrl: urls.get(story.path ?? "") ?? "",
              caption: story.caption,
              createdAt: story.created_at ?? "",
              expiresAt: story.expires_at ?? "",
            },
          ]
        : [];
    }),
  };
}

type HighlightBody = { title: string; storyIds: string[]; coverStoryId: string | null };

async function createHighlight(raw: unknown) {
  const input = body<HighlightBody>(raw);
  const stories = (input.storyIds ?? []).map(storyId);
  const cover = input.coverStoryId ? storyId(input.coverStoryId) : undefined;
  const id = check(
    await db().rpc("create_highlight", { title: input.title ?? "", story_ids: stories, cover }),
  );
  return highlightDetail(id);
}

async function updateHighlight(id: string, raw: unknown) {
  const input = body<HighlightBody>(raw);
  const stories = input.storyIds?.map(storyId);
  const cover = input.coverStoryId ? storyId(input.coverStoryId) : undefined;
  ok(
    await db().rpc("update_highlight", {
      highlight: id,
      title: input.title,
      story_ids: stories,
      cover,
      // undefined keeps the cover · null resets it to the first story · an id sets it
      set_cover: input.coverStoryId !== undefined,
    }),
  );
  return highlightDetail(id);
}

async function deleteHighlight(id: string) {
  const removed = check(await db().from("highlights").delete().eq("id", id).select("id"));
  if (removed.length === 0) {
    // highlights are public, so saying "it exists but isn't yours" gives nothing away
    const exists = check(await db().from("highlights").select("id").eq("id", id));
    throw exists.length
      ? new ApiError(403, "FORBIDDEN", "แก้หรือลบได้เฉพาะไฮไลต์ของตัวเอง")
      : notFound("ไฮไลต์นี้");
  }
  return {};
}

// ── โน้ต ─────────────────────────────────────────────────────────────────

type NoteRow = Database["community"]["Tables"]["notes"]["Row"];

const toNote = (row: NoteRow, me: string): Note => ({
  coreUserId: row.user_id,
  text: row.text,
  audience: row.audience as NoteAudience,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  isMe: row.user_id === me,
});

async function listNotes(): Promise<Note[]> {
  const me = await myId();
  const rows = check(
    await db().from("notes").select("*").order("created_at", { ascending: false }).limit(100),
  );
  // mine always leads the row
  return [
    ...rows.filter((row) => row.user_id === me),
    ...rows.filter((row) => row.user_id !== me),
  ].map((row) => toNote(row, me));
}

async function putNote(raw: unknown): Promise<Note> {
  const input = body<{ text: string; audience: NoteAudience }>(raw);
  ok(await db().rpc("put_note", { body: input.text ?? "", audience: input.audience }));
  const me = await myId();
  return toNote(check(await db().from("notes").select("*").eq("user_id", me).single()), me);
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

const S = "/stories/([^/]+)";
const path = (pattern: string) => new RegExp(`^${pattern}$`);

export const STORY_ROUTES: Route[] = [
  ["GET", path("/stories"), () => data(tray())],
  ["GET", path("/stories/archive"), ({ query }) => archive(query)],
  ["POST", path("/stories"), ({ body: raw }) => data(createStory(raw))],
  [
    "POST",
    path(`${S}/views`),
    async ({ params: [s] }) => {
      const story = storyId(s);
      return { data: { viewCount: check(await db().rpc("view_story", { story })) } };
    },
  ],
  ["POST", path(`${S}/replies`), ({ params: [s], body: raw }) => data(reply(storyId(s), raw))],
  [
    "GET",
    path(`${S}/insights`),
    async ({ params: [s] }) => {
      const story = storyId(s);
      return { data: check(await db().rpc("story_insights", { story })) };
    },
  ],
  ["GET", path(`${S}/viewers`), ({ params: [s], query }) => viewers(storyId(s), query)],
  [
    "DELETE",
    path(S),
    async ({ params: [s] }) => {
      const story = storyId(s);
      await purge([check(await db().rpc("delete_story", { story }))]);
      return { data: {} };
    },
  ],

  ["POST", path("/highlights"), ({ body: raw }) => data(createHighlight(raw))],
  ["GET", path("/highlights/([^/]+)"), ({ params: [h] }) => data(highlightDetail(highlightId(h)))],
  [
    "PATCH",
    path("/highlights/([^/]+)"),
    ({ params: [h], body: raw }) => data(updateHighlight(highlightId(h), raw)),
  ],
  [
    "DELETE",
    path("/highlights/([^/]+)"),
    ({ params: [h] }) => data(deleteHighlight(highlightId(h))),
  ],
  ["GET", path("/profiles/([^/]+)/highlights"), ({ params: [u] }) => data(highlightsOf(userId(u)))],

  ["GET", path("/notes"), () => data(listNotes())],
  ["PUT", path("/notes/me"), ({ body: raw }) => data(putNote(raw))],
  [
    "DELETE",
    path("/notes/me"),
    async () => {
      ok(
        await db()
          .from("notes")
          .delete()
          .eq("user_id", await myId()),
      );
      return { data: {} };
    },
  ],
];
