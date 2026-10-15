/// ช่องสื่อสารสด — csmju-nexus ใช้ socket.io ของหลังบ้าน NestJS ซึ่ง Empire ไม่มี
///
/// เก็บ API เดิมทุกตัว (connectSocket · bindSocket · emitWithAck · rooms) ให้หน้าจอเดิมไม่ต้องแก้
/// `Socket` ตรงนี้เป็นตัวกระจาย event หน้าตาเหมือน socket.io ที่ป้อนด้วย Supabase Realtime:
///   ห้อง (channel:join)  postgres_changes ของ messages (RLS: เฉพาะสมาชิก) + broadcast ส่วนตัว room:<id>
///   กล่องข้อความ          postgres_changes ของ channel_members / channels / messages → sync:changed
///   ใครออนไลน์           Presence หัวข้อ "online"
/// ส่งข้อความ (message:send) เรียก send_message เดียวกับ REST — ตัวตนมาจาก JWT ไม่ใช่จาก payload
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { db, supabase } from "@/lib/supabase";
import { sendMessage } from "./chat-api";
import { fetchMessage, reactionSummaries } from "./chat-model";
import { setOnline } from "./presence";
import { toNotification, unreadCount } from "./notify-api";
import { onReactionAnnounce } from "./realtime-bus";

type Listener = (...args: unknown[]) => void;
type Ack = (result: unknown) => void;

export class Socket {
  private listeners = new Map<string, Set<Listener>>();
  connected = false;

  on(event: string, listener: Listener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  off(event: string, listener?: Listener): this {
    if (listener) this.listeners.get(event)?.delete(listener);
    else this.listeners.delete(event);
    return this;
  }

  /** Server → client: deliver an event to every listener. */
  dispatch(event: string, payload: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(payload);
  }

  /** Client → server. The last argument may be an ack callback, like socket.io. */
  emit(event: string, ...args: unknown[]): this {
    const last = args.at(-1);
    const ack: Ack = typeof last === "function" ? (last as Ack) : () => undefined;
    handleEmit(event, args[0], ack).catch((error: unknown) => {
      ack({ ok: false, error: error instanceof Error ? error.message : "ทำรายการไม่สำเร็จ" });
    });
    return this;
  }
}

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "offline";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;
let status: SocketStatus = "offline";
let me = "";
let onlineNow = new Set<string>();
const statusHandlers = new Set<(status: SocketStatus) => void>();
const reconnectHandlers = new Set<() => void>();
const rooms = new Set<string>();
const joined = new Map<string, RealtimeChannel>();
const globalChannels: RealtimeChannel[] = [];

function setStatus(next: SocketStatus) {
  if (status === next) return;
  const wasDown = status === "reconnecting";
  status = next;
  if (socket) socket.connected = next === "connected";
  for (const handler of statusHandlers) handler(next);
  if (wasDown && next === "connected") for (const handler of reconnectHandlers) handler();
}

export function getSocketStatus(): SocketStatus {
  return status;
}

export function onSocketStatus(handler: (status: SocketStatus) => void) {
  statusHandlers.add(handler);
  return () => {
    statusHandlers.delete(handler);
  };
}

export function onSocketReconnect(handler: () => void) {
  reconnectHandlers.add(handler);
  return () => {
    reconnectHandlers.delete(handler);
  };
}

export function rememberRoom(channelId: string) {
  rooms.add(channelId);
}

export function forgetRoom(channelId: string) {
  rooms.delete(channelId);
}

// ── ห้อง ─────────────────────────────────────────────────────────────────

type MessageChange = {
  id: string;
  channel_id: string;
  parent_id: string | null;
  last_change: string;
};

async function onMessageChange(target: Socket, change: "INSERT" | "UPDATE", row: MessageChange) {
  if (change === "INSERT") {
    const message = await fetchMessage(row.id);
    if (!message) return;
    target.dispatch("message:new", message);
    // replies don't join the main timeline, but the "n replies" counter must move
    if (row.parent_id) {
      target.dispatch("thread:updated", { channelId: row.channel_id, parentId: row.parent_id });
    }
    return;
  }
  if (row.last_change === "delete") {
    target.dispatch("message:deleted", { channelId: row.channel_id, messageId: row.id });
    return;
  }
  const event =
    row.last_change === "edit"
      ? "message:edited"
      : row.last_change === "pin" || row.last_change === "unpin"
        ? "message:pinned"
        : row.last_change === "call"
          ? "message:updated"
          : null;
  if (!event) return;
  const message = await fetchMessage(row.id);
  if (message) target.dispatch(event, message);
}

async function announceReactionTo(target: Socket, channelId: string, targetId: string) {
  const [summary] = await reactionSummaries("MESSAGE", [targetId]);
  target.dispatch("reaction:changed", {
    channelId,
    targetKind: "MESSAGE",
    targetId,
    // per-viewer "reacted by me" comes from this viewer's own query
    totals: (summary?.totals ?? []).map((row) => ({
      ...row,
      reactorCoreUserIds: row.reactedByMe ? [me] : [],
    })),
    totalCount: summary?.totalCount ?? 0,
    actorCoreUserId: null,
  });
}

async function joinRoom(
  target: Socket,
  channelId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (joined.has(channelId)) return { ok: true };
  const membership = await db()
    .from("channel_members")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("user_id", me);
  if (membership.error || membership.data.length === 0) {
    return { ok: false, error: "ไม่พบห้องนี้ หรือคุณไม่ได้เป็นสมาชิก" };
  }

  const room = supabase
    .channel(`room:${channelId}`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "*", schema: "community", table: "messages", filter: `channel_id=eq.${channelId}` },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        onMessageChange(target, payload.eventType, payload.new as MessageChange).catch(
          (error: unknown) => {
            console.error("อัปเดตข้อความสดไม่สำเร็จ", error);
          },
        );
      },
    )
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      const coreUserId = (payload as { coreUserId?: unknown }).coreUserId;
      if (typeof coreUserId === "string") target.dispatch("typing:sync", { channelId, coreUserId });
    })
    .on("broadcast", { event: "reaction" }, ({ payload }) => {
      const targetId = (payload as { targetId?: unknown }).targetId;
      // the payload only says *what* changed; numbers are re-read under this viewer's RLS
      if (typeof targetId === "string") void announceReactionTo(target, channelId, targetId);
    });

  joined.set(channelId, room);
  const subscribed = await new Promise<boolean>((resolve) => {
    room.subscribe((state) => {
      if (state === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) resolve(true);
      else if (
        state === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
        state === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
      )
        resolve(false);
    });
  });
  if (!subscribed) {
    joined.delete(channelId);
    void supabase.removeChannel(room);
    return { ok: false, error: "เชื่อมต่อห้องสดไม่สำเร็จ" };
  }
  return { ok: true };
}

function leaveRoom(channelId: string) {
  const room = joined.get(channelId);
  if (!room) return;
  joined.delete(channelId);
  void supabase.removeChannel(room);
}

function broadcast(channelId: string, event: string, payload: Record<string, unknown>) {
  const room = joined.get(channelId);
  if (room) void room.send({ type: "broadcast", event, payload });
}

// ── สิ่งที่หน้าจอส่งมา ────────────────────────────────────────────────────

function channelOf(payload: unknown): string {
  const id = (payload as { channelId?: unknown } | null)?.channelId;
  return typeof id === "string" ? id : "";
}

async function handleEmit(event: string, payload: unknown, ack: Ack) {
  const target = await connectSocket();
  switch (event) {
    case "channel:join":
      ack(await joinRoom(target, channelOf(payload)));
      return;
    case "channel:leave":
      leaveRoom(channelOf(payload));
      ack({ ok: true });
      return;
    case "message:send": {
      // same function as REST; message:new reaches everyone (sender included) via postgres_changes
      const message = await sendMessage(channelOf(payload), payload);
      ack({ ok: true, clientNonce: message.clientNonce, messageId: message.id, seq: message.seq });
      return;
    }
    case "typing:start":
      broadcast(channelOf(payload), "typing", { coreUserId: me });
      ack({ ok: true });
      return;
    case "presence:heartbeat":
      ack({ ok: true });
      return;
    case "rtc:signal":
      ack(signal(payload));
      return;
    case "screen:claim":
      ack(await screenClaim(payload));
      return;
    case "screen:release":
      await rpcOrThrow(db().rpc("release_screen", { session: field(payload, "sessionId") }));
      ack({ ok: true });
      return;
    case "call:ring":
    case "call:answer":
    case "call:cancel":
    case "call:end":
      await callEvent(event, payload);
      ack({ ok: true });
      return;
    default:
      ack({ ok: false, error: "ฟีเจอร์นี้ยังไม่เปิดใช้" });
  }
}

// ── สาย · ห้องเสียง · สัญญาณ WebRTC ────────────────────────────────────────
//
// person-to-person events arrive on the private topic user:<me> (the database sends them with
// realtime.send); WebRTC offers/answers/ICE travel on voice:<session>, which only people in that
// session may read or write. The database never sees media — browsers connect peer to peer.

function field(payload: unknown, name: string): string {
  const value = (payload as Record<string, unknown> | null)?.[name];
  if (typeof value !== "string" || !UUID_RE.test(value)) throw new Error("คำขอไม่ถูกต้อง");
  return value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rpcOrThrow(call: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await call;
  if (error) throw new Error(error.message);
}

// when a ring started, so a cancel after the client's 45 s timeout counts as "missed"
const ringStarted = new Map<string, number>();
const RING_TIMEOUT_MS = 45_000;

async function callEvent(event: string, payload: unknown) {
  const session = field(payload, "sessionId");
  const peer = field(payload, "toCoreUserId");
  switch (event) {
    case "call:ring": {
      const media = (payload as { media?: unknown }).media === "VIDEO" ? "VIDEO" : "AUDIO";
      ringStarted.set(session, Date.now());
      await rpcOrThrow(db().rpc("call_ring", { session, callee: peer, media }));
      return;
    }
    case "call:answer":
      await rpcOrThrow(
        db().rpc("call_answer", {
          session,
          caller: peer,
          accepted: (payload as { accepted?: unknown }).accepted === true,
        }),
      );
      return;
    case "call:cancel": {
      const started = ringStarted.get(session);
      const timedOut = started !== undefined && Date.now() - started >= RING_TIMEOUT_MS - 1000;
      await rpcOrThrow(db().rpc("call_cancel", { session, callee: peer, timed_out: timedOut }));
      return;
    }
    default:
      ringStarted.delete(session);
      await rpcOrThrow(db().rpc("call_end", { session, peer }));
  }
}

async function screenClaim(payload: unknown) {
  const { data, error } = await db().rpc("claim_screen", { session: field(payload, "sessionId") });
  if (error) return { ok: false, error: error.message };
  return data;
}

let voice: {
  session: string;
  channel: RealtimeChannel;
  beat: ReturnType<typeof setInterval>;
} | null = null;
let voiceToken = "";

function signal(payload: unknown) {
  const to = (payload as { toCoreUserId?: unknown } | null)?.toCoreUserId;
  if (!voice) return { ok: false, error: "คุณไม่ได้อยู่ในห้องเสียงนี้" };
  if (typeof to !== "string") return { ok: false, error: "คำขอไม่ถูกต้อง" };
  if (to === me) return { ok: false, error: "ส่งสัญญาณหาตัวเองไม่ได้" };
  void voice.channel.send({
    type: "broadcast",
    event: "rtc:signal",
    payload: { ...(payload as object), fromCoreUserId: me },
  });
  return { ok: true };
}

/** Joined a voice session: listen for its signals, heartbeat, and leave on tab close. */
export async function enterVoice(session: string): Promise<void> {
  if (voice?.session === session) return;
  if (voice) exitVoice(voice.session);
  const target = await connectSocket();
  voiceToken = (await supabase.auth.getSession()).data.session?.access_token ?? "";
  const channel = supabase
    .channel(`voice:${session}`, { config: { private: true } })
    .on("broadcast", { event: "rtc:signal" }, ({ payload }) => {
      if ((payload as { toCoreUserId?: unknown }).toCoreUserId === me)
        target.dispatch("rtc:signal", payload);
    })
    .on("broadcast", { event: "screen:changed" }, ({ payload }) => {
      target.dispatch("screen:changed", payload);
    });
  await new Promise<void>((resolve) => {
    channel.subscribe((state) => {
      if (state !== REALTIME_SUBSCRIBE_STATES.CLOSED) resolve();
    });
  });
  // the database sweeps anyone silent for 90 s — this is how it knows we're still here
  const beat = setInterval(() => {
    void supabase.auth.getSession().then(({ data }) => {
      voiceToken = data.session?.access_token ?? voiceToken;
    });
    void db().rpc("voice_heartbeat", { session });
  }, 25_000);
  voice = { session, channel, beat };
}

export function exitVoice(session: string): void {
  if (voice?.session !== session) return;
  clearInterval(voice.beat);
  void supabase.removeChannel(voice.channel);
  voice = null;
}

// a closing tab gets no chance to await anything: fire-and-forget the leave so the room updates now
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (!voice || !voiceToken) return;
    void fetch(`${env.supabase.url}/rest/v1/rpc/leave_voice`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: env.supabase.publishableKey,
        Authorization: `Bearer ${voiceToken}`,
        "Content-Type": "application/json",
        "Content-Profile": "community",
      },
      body: JSON.stringify({ session: voice.session }),
    });
  });
}

// ── เชื่อมต่อ ────────────────────────────────────────────────────────────

let inboxTimer: ReturnType<typeof setTimeout> | null = null;

function pingInbox(target: Socket) {
  if (inboxTimer) return;
  inboxTimer = setTimeout(() => {
    inboxTimer = null;
    target.dispatch("sync:changed", { topic: "inbox" });
  }, 250);
}

async function start(target: Socket) {
  const { data } = await supabase.auth.getSession();
  me = data.session?.user.id ?? "";
  if (!me) throw new Error("ต้องเข้าสู่ระบบ");
  await supabase.realtime.setAuth();

  const inbox = supabase
    .channel(`inbox:${me}`)
    // any message in any of my rooms (RLS decides which) re-sorts the inbox
    .on("postgres_changes", { event: "INSERT", schema: "community", table: "messages" }, () => {
      pingInbox(target);
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "community", table: "channel_members" },
      (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as {
          channel_id?: string;
        };
        if (row.channel_id) target.dispatch("channel:members", { channelId: row.channel_id });
        pingInbox(target);
      },
    )
    // my notifications (RLS: only mine) — silent ones were written while I paused notifications
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "community", table: "notifications" },
      (payload) => {
        const row = payload.new as Parameters<typeof toNotification>[0];
        if (row.silent) return;
        void unreadCount().then((count) => {
          target.dispatch("notification:new", {
            notification: toNotification(row),
            unreadCount: count,
          });
        });
      },
    )
    .on("postgres_changes", { event: "*", schema: "community", table: "channels" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const row = payload.old as { id?: string };
        if (row.id)
          target.dispatch("channel:deleted", { channelId: row.id, deletedByCoreUserId: "" });
      } else {
        const row = payload.new as { id: string; name: string | null; description: string | null };
        target.dispatch("channel:updated", {
          channelId: row.id,
          name: row.name,
          description: row.description,
        });
      }
      pingInbox(target);
    });

  const presence = supabase.channel("online", { config: { private: true, presence: { key: me } } });
  presence.on("presence", { event: "sync" }, () => {
    const before = onlineNow;
    onlineNow = new Set(Object.keys(presence.presenceState()));
    setOnline(onlineNow);
    for (const id of onlineNow) {
      if (!before.has(id)) target.dispatch("presence:changed", { coreUserId: id, online: true });
    }
    for (const id of before) {
      if (!onlineNow.has(id))
        target.dispatch("presence:changed", { coreUserId: id, online: false });
    }
  });

  const personal = supabase.channel(`user:${me}`, { config: { private: true } });
  for (const event of [
    "call:incoming",
    "call:answered",
    "call:cancelled",
    "call:ended",
    "voice:occupants",
  ]) {
    personal.on("broadcast", { event }, ({ payload }) => {
      target.dispatch(event, payload);
    });
  }
  personal.subscribe();

  globalChannels.push(inbox, presence, personal);
  inbox.subscribe((state) => {
    if (state === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) setStatus("connected");
    else if (
      state === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
      state === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
    )
      setStatus("reconnecting");
  });
  presence.subscribe((state) => {
    if (state !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) return;
    // people who turned off "show activity status" stay invisible
    void db()
      .from("profiles")
      .select("show_activity_status")
      .eq("user_id", me)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (profile?.show_activity_status !== false) {
          void presence.track({ at: new Date().toISOString() });
        }
      });
  });

  onReactionAnnounce((channelId, targetId) => {
    broadcast(channelId, "reaction", { targetId });
    void announceReactionTo(target, channelId, targetId);
  });
}

export function connectSocket(): Promise<Socket> {
  if (socket) return Promise.resolve(socket);
  connecting ??= (async () => {
    const target = new Socket();
    setStatus("connecting");
    try {
      await start(target);
    } catch (error) {
      connecting = null;
      setStatus("offline");
      throw error;
    }
    socket = target;
    return target;
  })();
  return connecting;
}

export function currentSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  for (const channelId of [...joined.keys()]) leaveRoom(channelId);
  for (const channel of globalChannels.splice(0)) void supabase.removeChannel(channel);
  onReactionAnnounce(null);
  socket = null;
  connecting = null;
  rooms.clear();
  setStatus("offline");
}

export function bindSocket<T = unknown>(
  target: Socket,
  event: string,
  handler: (payload: T) => void | Promise<void>,
): () => void {
  const listener = (payload: unknown) => {
    Promise.resolve(handler(payload as T)).catch((error: unknown) => {
      console.error(`ทำงานกับ event ${event} ไม่สำเร็จ`, error);
    });
  };
  target.on(event, listener);
  return () => {
    target.off(event, listener);
  };
}

export function emitWithAck<T>(
  target: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`ไม่ได้รับการตอบกลับจาก ${event}`));
    }, timeoutMs);

    target.emit(event, payload, (result: T) => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}
