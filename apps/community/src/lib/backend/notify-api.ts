/// การแจ้งเตือน · การตั้งค่าการแจ้งเตือน · ค้นหา (community รอบ 5)
/// แถวแจ้งเตือนเกิดจาก trigger ในฐาน (notify) — ไฟล์นี้แค่อ่าน ทำเครื่องหมายว่าอ่านแล้ว และแปลงรูปร่าง
import type { Database } from "@empire/core/supabase";
import { db } from "@/lib/supabase";
import {
  badRequest,
  check,
  data,
  fromPostgrest,
  idParam,
  meta,
  myId,
  ok,
  paging,
  type Route,
  body,
} from "./api-core";
import type { Notification, NotificationKind, SearchAll, SearchHit } from "./types";

type NotificationRow = Database["community"]["Tables"]["notifications"]["Row"];
type PrefsRow = Database["community"]["Tables"]["notification_preferences"]["Row"];

const KINDS = new Set<NotificationKind>([
  "REEL_LIKE",
  "REEL_COMMENT",
  "POST_COMMENT",
  "MENTION",
  "VOICE_INVITE",
  "FOLLOW",
  "REACTION",
  "THREAD_REPLY",
  "MEETING_INVITE",
  "CHANNEL_INVITE",
  "REEL_REPOST",
  "STORY_REPLY",
  "COMMENT_LIKE",
  "MISSED_CALL",
]);

export const toNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  kind: row.kind,
  refId: row.ref_id,
  actorCoreUserId: row.actor_id,
  payload: row.payload as Record<string, unknown> | null,
  readAt: row.read_at,
  createdAt: row.created_at,
});

export async function unreadCount(): Promise<number> {
  const { count, error } = await db()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", await myId())
    .is("read_at", null);
  if (error) throw fromPostgrest(error);
  return count ?? 0;
}

async function listNotifications(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const kinds = [
    ...new Set(
      (query.get("kind") ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ];
  for (const kind of kinds)
    if (!KINDS.has(kind as NotificationKind)) throw badRequest(`kind ไม่ถูกต้อง: ${kind}`);
  let request = db()
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", await myId());
  if (query.get("unreadOnly") === "true") request = request.is("read_at", null);
  if (kinds.length) request = request.in("kind", kinds);
  const {
    data: rows,
    error,
    count,
  } = await request
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toNotification), meta: meta(page, limit, count ?? 0) };
}

// ── การตั้งค่าการแจ้งเตือน ──────────────────────────────────────────────

const AUDIENCE = ["OFF", "FOLLOWING", "EVERYONE"] as const;
const MESSAGES = ["OFF", "PRIMARY", "PRIMARY_GENERAL"] as const;
const PAUSES = [15, 60, 120, 480];
const TOGGLES = {
  commentLikes: "comment_likes",
  newFollowers: "new_followers",
  reposts: "reposts",
  storyReplies: "story_replies",
  messageRequests: "message_requests",
  groupRequests: "group_requests",
} as const;

type Prefs = Omit<PrefsRow, "user_id" | "updated_at">;
const DEFAULTS: Prefs = {
  paused_until: null,
  likes: "EVERYONE",
  comments: "EVERYONE",
  mentions: "EVERYONE",
  comment_likes: true,
  new_followers: true,
  reposts: true,
  story_replies: true,
  message_requests: true,
  group_requests: true,
  messages: "PRIMARY_GENERAL",
};

const onOff = (value: boolean) => (value ? "ON" : "OFF");

function toPreferences(p: Prefs) {
  const paused = p.paused_until && Date.parse(p.paused_until) > Date.now() ? p.paused_until : null;
  return {
    pausedUntil: paused,
    likes: p.likes,
    comments: p.comments,
    mentions: p.mentions,
    commentLikes: onOff(p.comment_likes),
    newFollowers: onOff(p.new_followers),
    reposts: onOff(p.reposts),
    storyReplies: onOff(p.story_replies),
    messageRequests: onOff(p.message_requests),
    groupRequests: onOff(p.group_requests),
    messages: p.messages,
  };
}

async function myPreferences() {
  const { data: row, error } = await db()
    .from("notification_preferences")
    .select("*")
    .eq("user_id", await myId())
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  return toPreferences(row ?? DEFAULTS);
}

function pick<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (!allowed.includes(value as T)) throw badRequest(`${field} ต้องเป็น ${allowed.join(", ")}`);
  return value as T;
}

async function updatePreferences(raw: unknown) {
  const input = body<Record<string, unknown>>(raw);
  const patch: Partial<Prefs> = {};
  for (const field of ["likes", "comments", "mentions"] as const)
    if (input[field] !== undefined) patch[field] = pick(input[field], AUDIENCE, field);
  if (input.messages !== undefined) patch.messages = pick(input.messages, MESSAGES, "messages");
  for (const [field, column] of Object.entries(TOGGLES))
    if (input[field] !== undefined)
      patch[column] = pick(input[field], ["ON", "OFF"], field) === "ON";
  if (input.pauseMinutes !== undefined) {
    if (input.pauseMinutes !== null && !PAUSES.includes(input.pauseMinutes as number))
      throw badRequest("pauseMinutes ต้องเป็น 15, 60, 120, 480 หรือ null");
    patch.paused_until =
      input.pauseMinutes === null
        ? null
        : new Date(Date.now() + (input.pauseMinutes as number) * 60_000).toISOString();
  }
  ok(
    await db()
      .from("notification_preferences")
      .upsert({ user_id: await myId(), ...patch }),
  );
  return myPreferences();
}

// ── ค้นหา ────────────────────────────────────────────────────────────────

const SEARCH_KINDS = new Set(["all", "reels", "posts", "people", "messages"]);
const KIND_KEY: Record<string, keyof SearchAll["counts"]> = {
  REEL: "reels",
  POST: "posts",
  PERSON: "people",
  MESSAGE: "messages",
};

/** 160 characters around the first match, with … where text was cut. */
export function snippet(text: string | null, q: string): string | null {
  if (!text) return null;
  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return text.slice(0, 160);
  const start = Math.max(0, at - 40);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 160)}${start + 160 < text.length ? "…" : ""}`;
}

async function search(query: URLSearchParams) {
  const q = (query.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 100) throw badRequest("คำค้นต้องยาวอย่างน้อย 2 ตัวอักษร");
  const kind = query.get("kind") ?? "all";
  if (!SEARCH_KINDS.has(kind))
    throw badRequest("kind ต้องเป็น all, reels, posts, people หรือ messages");
  const { page, limit, from } = paging(query);
  const rows = check(
    await db().rpc("search", { q, kind, skip: kind === "all" ? 0 : from, max_rows: limit }),
  );
  const hits = rows.map((row): SearchHit => ({
    kind: row.hit_kind,
    id: row.id,
    title: row.title,
    snippet: snippet(row.body, q),
    authorCoreUserId: row.author_id,
    channelId: row.channel_id,
    createdAt: row.created_at,
  }));
  if (kind !== "all") return { data: hits, meta: meta(page, limit, rows[0]?.total ?? 0) };
  const counts: SearchAll["counts"] = { reels: 0, posts: 0, people: 0, messages: 0 };
  for (const row of rows) {
    const key = KIND_KEY[row.hit_kind];
    if (key) counts[key] = row.total;
  }
  return { data: { query: q, counts, hits } satisfies SearchAll };
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

export const NOTIFY_ROUTES: Route[] = [
  ["GET", /^\/notifications$/, ({ query }) => listNotifications(query)],
  [
    "GET",
    /^\/notifications\/unread-count$/,
    async () => ({ data: { unreadCount: await unreadCount() } }),
  ],
  [
    "PATCH",
    /^\/notifications\/read-all$/,
    async () => ({ data: { marked: check(await db().rpc("mark_all_notifications_read")) } }),
  ],
  [
    "PATCH",
    /^\/notifications\/([^/]+)\/read$/,
    async ({ params: [n] }) => {
      const notification = idParam(n, "การแจ้งเตือนนี้");
      const count = check(await db().rpc("mark_notification_read", { notification }));
      return { data: { unreadCount: count } };
    },
  ],
  ["GET", /^\/me\/notification-preferences$/, () => data(myPreferences())],
  ["PATCH", /^\/me\/notification-preferences$/, ({ body: raw }) => data(updatePreferences(raw))],
  ["GET", /^\/search$/, ({ query }) => search(query)],
];
