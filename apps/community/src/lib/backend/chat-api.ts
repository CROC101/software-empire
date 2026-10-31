/// แชท: ห้อง · สมาชิก · ข้อความ · รีแอ็กชัน · ผู้ออนไลน์ (community รอบ 2)
/// ทุกการเขียนเรียกฟังก์ชัน SQL ที่ตรวจกติกาเดิมของ csmju-nexus ซ้ำในฐาน — ไฟล์นี้แค่แปลงรูปร่างข้อมูล
import type { Database } from "@empire/core/supabase";
import { db } from "@/lib/supabase";
import {
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
  UUID,
} from "./api-core";
import { fetchChannel, fetchMessage, reactionSummaries, toMessages } from "./chat-model";
import { isOnline, onlineUserIds } from "./presence";
import { reactionChanged } from "./realtime-bus";
import { purge } from "./storage";
import type {
  Channel,
  ChannelMemberRow,
  ClearChannelResult,
  CreateDirectChannelBody,
  DeliveryResult,
  Message,
  MessageTargets,
  ShareBody,
  PresenceResponse,
  ReactionSummary,
  ReactionTarget,
  UpdateInboxBody,
} from "./types";

const channelId = (raw: string | undefined) => idParam(raw, "ห้องนี้ หรือคุณไม่ได้เป็นสมาชิก");
const messageId = (raw: string | undefined) => idParam(raw, "ข้อความนี้");

async function channelOrThrow(channel: string): Promise<Channel> {
  const row = await fetchChannel(channel);
  if (!row) throw notFound("ห้องนี้ หรือคุณไม่ได้เป็นสมาชิก");
  return row;
}

async function messageOrThrow(message: string): Promise<Message> {
  const row = await fetchMessage(message);
  if (!row) throw notFound("ข้อความนี้");
  return row;
}

// ── ห้อง ─────────────────────────────────────────────────────────────────

async function listChannels(query: URLSearchParams) {
  const { page, limit, from } = paging(query, 50);
  const rows = check(await db().rpc("channel_rows", { max_rows: limit, skip: from }));
  const items = rows as unknown as Channel[];
  // shortcut: total is "at least what we've seen" — the inbox loads one page of 50
  return {
    data: items,
    meta: meta(page, limit, from + items.length + (items.length === limit ? 1 : 0)),
  };
}

async function createChannel(raw: unknown) {
  const input = body<{
    kind: string;
    name: string;
    description: string;
    courseTag: string;
    maxSeats: number;
  }>(raw);
  if (!input.kind || !input.name?.trim()) throw badRequest("ตั้งชื่อห้องก่อน");
  const created = check(
    await db().rpc("create_channel", {
      kind: input.kind,
      name: input.name,
      description: input.description,
      course_tag: input.courseTag,
      max_seats: input.maxSeats,
    }),
  );
  return channelOrThrow(created);
}

async function openDirect(raw: unknown) {
  const input = body<CreateDirectChannelBody>(raw);
  const peers = input.peerCoreUserIds ?? (input.peerCoreUserId ? [input.peerCoreUserId] : []);
  if (peers.length === 0) throw badRequest("เลือกคนที่จะส่งข้อความหา");
  const ids = peers.map((p) => userId(p));
  const opened = check(await db().rpc("open_direct", { peers: ids, group_name: input.name }));
  return channelOrThrow(opened);
}

async function members(channel: string, query: URLSearchParams) {
  const { page, limit } = paging(query, 50);
  const rows = check(
    await db()
      .from("channel_members")
      .select("user_id,role,nickname,joined_at")
      .eq("channel_id", channel)
      .order("joined_at"),
  );
  const status = query.get("status");
  const all: ChannelMemberRow[] = rows
    .map((r) => ({
      coreUserId: r.user_id,
      role: r.role as ChannelMemberRow["role"],
      nickname: r.nickname,
      joinedAt: r.joined_at,
      online: isOnline(r.user_id),
      lastActiveAt: null,
      inVoice: false,
    }))
    .filter((m) => (status === "online" ? m.online : status === "offline" ? !m.online : true));
  return { data: all.slice((page - 1) * limit, page * limit), meta: meta(page, limit, all.length) };
}

// ── ข้อความ ──────────────────────────────────────────────────────────────

async function listMessages(channel: string, query: URLSearchParams, pinnedOnly = false) {
  const { page, limit, from, to } = paging(query, 30);
  const me = await myId();
  const membership = check(
    await db()
      .from("channel_members")
      .select("cleared_at")
      .eq("channel_id", channel)
      .eq("user_id", me),
  );
  if (membership.length === 0) throw notFound("ห้องนี้ หรือคุณไม่ได้เป็นสมาชิก");

  let request = db()
    .from("message_view")
    .select("*", { count: "exact" })
    .eq("channel_id", channel)
    .is("deleted_at", null);
  const parent = query.get("parentId");
  request = parent ? request.eq("parent_id", messageId(parent)) : request.is("parent_id", null);
  if (pinnedOnly) request = request.not("pinned_at", "is", null);
  // "clear chat" hides history for this member only
  const clearedAt = membership[0]?.cleared_at;
  if (clearedAt) request = request.gt("created_at", clearedAt);

  const {
    data: rows,
    error,
    count,
  } = await (pinnedOnly
    ? request.order("pinned_at", { ascending: false }).limit(50)
    : request.order("seq", { ascending: false }).range(from, to));
  if (error) throw fromPostgrest(error);
  // newest first, like nexus — the screen reverses it
  return { data: await toMessages(rows), meta: meta(page, limit, count ?? 0) };
}

type SendBody = {
  content: string;
  clientNonce: string;
  parentId: string;
  replyToMessageId: string;
  assetIds: string[];
};

/** Shared by REST and the socket's `message:send`. */
export async function sendMessage(channel: string, raw: unknown): Promise<Message> {
  const input = body<SendBody>(raw);
  if (!input.clientNonce) throw badRequest("ไม่มีรหัสข้อความ (clientNonce)");
  // validate every id before the first database call
  const args = {
    channel,
    body: input.content ?? "",
    nonce: input.clientNonce,
    parent: input.parentId ? messageId(input.parentId) : undefined,
    reply_to: input.replyToMessageId ? messageId(input.replyToMessageId) : undefined,
    attachments: (input.assetIds ?? []).map((a) => idParam(a, "ไฟล์แนบ")),
  };
  const sent = check(await db().rpc("send_message", args));
  return messageOrThrow(sent);
}

type SendArgs = Database["community"]["Functions"]["send_message"]["Args"];

/** 1-20 rooms and people (a DM is opened for each person) — all validated before any database call. */
function destinations(raw: unknown) {
  const input = body<MessageTargets>(raw);
  const channelIds = (input.channelIds ?? []).map(channelId);
  const peers = (input.peerCoreUserIds ?? []).map((p) => userId(p));
  if (channelIds.length + peers.length === 0)
    throw badRequest("ระบุปลายทางอย่างน้อยหนึ่งห้องหรือหนึ่งคน");
  if (channelIds.length + peers.length > 20) throw badRequest("ส่งได้ครั้งละไม่เกิน 20 ปลายทาง");
  return { channelIds, peers };
}

async function deliver(
  to: ReturnType<typeof destinations>,
  args: Omit<SendArgs, "channel" | "nonce">,
): Promise<DeliveryResult> {
  const rooms = [...to.channelIds];
  for (const peer of to.peers) rooms.push(check(await db().rpc("open_direct", { peers: [peer] })));
  const result: DeliveryResult = { channelIds: [], messageIds: [] };
  for (const room of new Set(rooms)) {
    const sent = check(
      await db().rpc("send_message", { ...args, channel: room, nonce: crypto.randomUUID() }),
    );
    result.channelIds.push(room);
    result.messageIds.push(sent);
  }
  return result;
}

async function forward(message: string, raw: unknown): Promise<DeliveryResult> {
  const to = destinations(raw);
  const original = await messageOrThrow(message);
  // a card whose post/reel/story is gone can't travel on
  const card = original.embed?.available ? original.embed : null;
  if (!original.content && !card) throw badRequest("ข้อความนี้ไม่มีอะไรให้ส่งต่อ");
  return deliver(to, {
    body: original.content ?? "",
    is_forward: true,
    embed_kind: card?.kind,
    embed_ref: card?.refId,
  });
}

const SHARE_KINDS = new Set(["POST", "REEL", "STORY"]);

async function share(raw: unknown): Promise<DeliveryResult> {
  const input = body<ShareBody>(raw);
  if (!input.targetKind || !SHARE_KINDS.has(input.targetKind))
    throw badRequest("targetKind ต้องเป็น POST, REEL หรือ STORY");
  const target = idParam(input.targetId, "สิ่งที่จะแชร์");
  const message = input.message?.trim() ?? "";
  if (message.length > 1000) throw badRequest("ข้อความแนบยาวได้ไม่เกิน 1000 ตัวอักษร");
  return deliver(destinations(raw), {
    body: message,
    embed_kind: input.targetKind,
    embed_ref: target,
  });
}

// ── รีแอ็กชัน ────────────────────────────────────────────────────────────

const TARGET_KINDS = new Set<ReactionTarget>(["MESSAGE", "POST", "REEL"]);

function reactionTarget(kind: string | null | undefined, target: string | null | undefined) {
  if (!kind || !TARGET_KINDS.has(kind as ReactionTarget))
    throw badRequest("ชนิดเป้าหมายไม่ถูกต้อง");
  const what = { MESSAGE: "ข้อความนี้", POST: "โพสต์นี้", REEL: "คลิปนี้" }[kind as ReactionTarget];
  return { kind: kind as ReactionTarget, target: idParam(target ?? undefined, what) };
}

async function summaryOf(kind: ReactionTarget, target: string): Promise<ReactionSummary> {
  // tell the room so other members re-read the counts (they never trust a broadcast's numbers)
  if (kind === "MESSAGE") {
    const message = await fetchMessage(target);
    if (message) reactionChanged(message.channelId, target);
  }
  const [summary] = await reactionSummaries(kind, [target]);
  return summary ?? { targetKind: kind, targetId: target, totals: [], totalCount: 0 };
}

async function react(raw: unknown) {
  const input = body<{ targetKind: string; targetId: string; emoji: string }>(raw);
  const { kind, target } = reactionTarget(input.targetKind, input.targetId);
  const emoji = input.emoji?.trim();
  if (!emoji) throw badRequest("เลือกอิโมจิ");
  const { error } = await db()
    .from("reactions")
    .insert({ target_kind: kind, target_id: target, user_id: await myId(), emoji });
  if (error && error.code !== "23505")
    throw error.code === "42501" ? notFound("สิ่งที่จะรีแอ็กชัน") : fromPostgrest(error);
  return summaryOf(kind, target);
}

async function unreact(query: URLSearchParams) {
  const { kind, target } = reactionTarget(query.get("targetKind"), query.get("targetId"));
  ok(
    await db()
      .from("reactions")
      .delete()
      .eq("target_kind", kind)
      .eq("target_id", target)
      .eq("user_id", await myId())
      .eq("emoji", query.get("emoji") ?? ""),
  );
  return summaryOf(kind, target);
}

async function summaries(query: URLSearchParams) {
  const kind = query.get("targetKind");
  if (kind !== "MESSAGE" && kind !== "POST" && kind !== "REEL") return [];
  const ids = (query.get("targetIds") ?? "")
    .split(",")
    .filter((t) => UUID.test(t))
    .slice(0, 100);
  return reactionSummaries(kind, ids);
}

function presence(query: URLSearchParams): PresenceResponse {
  const ids = (query.get("ids") ?? "").split(",").filter(Boolean);
  const online = onlineUserIds();
  return {
    onlineCoreUserIds: ids.length ? online.filter((u) => ids.includes(u)) : online,
    totalOnline: online.length,
    users: ids.map((u) => ({ coreUserId: u, online: isOnline(u), lastActiveAt: null })),
  };
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

const C = "/channels/([^/]+)";
const M = `${C}/messages/([^/]+)`;
const path = (pattern: string) => new RegExp(`^${pattern}$`);

export const CHAT_ROUTES: Route[] = [
  ["GET", path("/channels"), ({ query }) => listChannels(query)],
  ["POST", path("/channels"), ({ body: raw }) => data(createChannel(raw))],
  ["POST", path("/direct-channels"), ({ body: raw }) => data(openDirect(raw))],
  ["GET", path(C), ({ params: [c] }) => data(channelOrThrow(channelId(c)))],
  [
    "PATCH",
    path(C),
    async ({ params: [c], body: raw }) => {
      const channel = channelId(c);
      const input = body<{ name: string; description: string | null }>(raw);
      ok(
        await db().rpc("update_channel", {
          channel,
          new_name: input.name,
          new_description: input.description ?? undefined,
        }),
      );
      return data(channelOrThrow(channel));
    },
  ],
  [
    "DELETE",
    path(C),
    async ({ params: [c] }) => {
      const channel = channelId(c);
      ok(await db().rpc("delete_channel", { channel }));
      return { data: {} };
    },
  ],
  [
    "PATCH",
    path(`${C}/inbox`),
    async ({ params: [c], body: raw }) => {
      const channel = channelId(c);
      const input = body<UpdateInboxBody>(raw);
      ok(
        await db().rpc("update_inbox", {
          channel,
          folder: input.folder,
          pinned: input.pinned,
          mute: input.muted,
        }),
      );
      return data(channelOrThrow(channel));
    },
  ],
  [
    "POST",
    path(`${C}/clear`),
    async ({ params: [c] }) => {
      const channel = channelId(c);
      const clearedAt = check(await db().rpc("clear_channel", { channel }));
      const result: ClearChannelResult = { channelId: channel, clearedAt };
      return { data: result };
    },
  ],
  [
    "POST",
    path(`${C}/unread`),
    async ({ params: [c] }) => {
      const channel = channelId(c);
      ok(await db().rpc("mark_unread", { channel }));
      return data(channelOrThrow(channel));
    },
  ],
  [
    "POST",
    path(`${C}/read-markers`),
    async ({ params: [c], body: raw }) => {
      ok(
        await db().rpc("mark_read", {
          channel: channelId(c),
          upto: Number(body<{ seq: number }>(raw).seq) || 0,
        }),
      );
      return { data: {} };
    },
  ],
  [
    "PUT",
    path(`${C}/members/([^/]+)/nickname`),
    async ({ params: [c, u], body: raw }) => {
      const channel = channelId(c);
      ok(
        await db().rpc("set_nickname", {
          channel,
          target: userId(u),
          nick: body<{ nickname: string | null }>(raw).nickname ?? "",
        }),
      );
      return data(channelOrThrow(channel));
    },
  ],
  ["GET", path(`${C}/members`), ({ params: [c], query }) => members(channelId(c), query)],
  [
    "POST",
    path(`${C}/members`),
    async ({ params: [c], body: raw }) => {
      const users = (body<{ coreUserIds: string[] }>(raw).coreUserIds ?? []).map((u) => userId(u));
      const channel = channelId(c);
      const added = check(await db().rpc("add_members", { channel, users }));
      return { data: { added } };
    },
  ],
  [
    "DELETE",
    path(`${C}/members/me`),
    async ({ params: [c] }) => {
      const channel = channelId(c);
      ok(await db().rpc("leave_channel", { channel }));
      return { data: {} };
    },
  ],
  [
    "DELETE",
    path(`${C}/members/([^/]+)`),
    async ({ params: [c, u] }) => {
      const ids = { channel: channelId(c), target: userId(u) };
      ok(await db().rpc("remove_member", ids));
      return { data: {} };
    },
  ],
  ["GET", path(`${C}/messages`), ({ params: [c], query }) => listMessages(channelId(c), query)],
  [
    "GET",
    path(`${C}/messages/pinned`),
    ({ params: [c], query }) => listMessages(channelId(c), query, true),
  ],
  [
    "GET",
    path(`${M}/thread`),
    ({ params: [c, m], query }) => {
      query.set("parentId", messageId(m));
      return listMessages(channelId(c), query);
    },
  ],
  [
    "POST",
    path(`${C}/messages`),
    ({ params: [c], body: raw }) => data(sendMessage(channelId(c), raw)),
  ],
  [
    "PATCH",
    path(M),
    async ({ params: [c, m], body: raw }) => {
      channelId(c);
      const message = messageId(m);
      ok(
        await db().rpc("edit_message", {
          message,
          body: body<{ content: string }>(raw).content ?? "",
        }),
      );
      return data(messageOrThrow(message));
    },
  ],
  [
    "DELETE",
    path(M),
    async ({ params: [c, m] }) => {
      channelId(c);
      const message = messageId(m);
      // read the attachments first: the delete takes their rows with it
      const files = check(
        await db().from("assets").select("object_path").eq("message_id", message),
      );
      ok(await db().rpc("delete_message", { message }));
      await purge(files.map((file) => file.object_path));
      return { data: {} };
    },
  ],
  ...(["PUT", "DELETE"] as const).map((method): Route => [
    method,
    path(`${M}/pin`),
    async ({ params: [c, m] }) => {
      channelId(c);
      const message = messageId(m);
      ok(await db().rpc("set_pin", { message, pinned: method === "PUT" }));
      return data(messageOrThrow(message));
    },
  ]),
  [
    "POST",
    path(`${M}/forwards`),
    ({ params: [c, m], body: raw }) => (channelId(c), data(forward(messageId(m), raw))),
  ],
  ["GET", path("/reactions/summaries"), ({ query }) => data(summaries(query))],
  ["POST", path("/reactions"), ({ body: raw }) => data(react(raw))],
  ["POST", path("/shares"), ({ body: raw }) => data(share(raw))],
  ["DELETE", path("/reactions"), ({ query }) => data(unreact(query))],
  ["GET", path("/presence"), ({ query }) => Promise.resolve({ data: presence(query) })],
];
