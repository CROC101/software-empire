/// นัดประชุม · ห้องเสียง · คะแนนหลังวางสาย (community รอบ 6)
/// ฐานข้อมูลตัดสินว่าใครเข้าห้องได้และนั่งที่ไหน ส่วนเสียง/ภาพวิ่งตรงระหว่างเบราว์เซอร์ (WebRTC แบบ P2P)
/// สัญญาณ WebRTC และเหตุการณ์ของสายอยู่ใน socket.ts
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
  notFound,
  ok,
  paging,
  type Route,
} from "./api-core";
import { enterVoice, exitVoice } from "./socket";
import type { IceServer, JoinVoiceResponse, Meeting, VoiceOccupants, VoiceSession } from "./types";

type MeetingRow = Database["community"]["Views"]["meeting_view"]["Row"];

const channelId = (raw: string | undefined) => idParam(raw, "ห้องนี้ หรือคุณไม่ได้เป็นสมาชิก");
const sessionId = (raw: string | undefined) => idParam(raw, "ห้องเสียงนี้");
const meetingId = (raw: string | undefined) => idParam(raw, "นัดประชุมนี้");

// ── นัดประชุม ────────────────────────────────────────────────────────────

const toMeeting = (row: MeetingRow): Meeting => ({
  id: row.id ?? "",
  channelId: row.channel_id ?? "",
  title: row.title ?? "",
  agenda: row.agenda,
  startsAt: row.starts_at ?? "",
  endsAt: row.ends_at ?? "",
  status: (row.status ?? "SCHEDULED") as Meeting["status"],
  createdByCoreUserId: row.created_by ?? "",
  joinableNow: row.joinable_now ?? false,
  createdAt: row.created_at ?? "",
});

async function meetingOrThrow(id: string): Promise<Meeting> {
  const { data: row, error } = await db()
    .from("meeting_view")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!row) throw notFound("นัดประชุมนี้");
  return toMeeting(row);
}

async function listMeetings(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const rawChannel = query.get("channelId");
  const channel = rawChannel ? channelId(rawChannel) : null;
  const upcoming = query.get("upcomingOnly") !== "false";
  let request = db().from("meeting_view").select("*", { count: "exact" });
  if (channel) request = request.eq("channel_id", channel);
  if (upcoming)
    request = request.gte("ends_at", new Date().toISOString()).neq("status", "CANCELLED");
  const {
    data: rows,
    error,
    count,
  } = await request.order("starts_at", { ascending: upcoming }).range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toMeeting), meta: meta(page, limit, count ?? 0) };
}

const STRICT_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

async function createMeeting(raw: unknown) {
  const input = body<{
    channelId: string;
    title: string;
    agenda: string;
    startsAt: string;
    endsAt: string;
  }>(raw);
  const channel = channelId(input.channelId);
  if (!STRICT_ISO.test(input.startsAt ?? "") || !STRICT_ISO.test(input.endsAt ?? ""))
    throw badRequest("startsAt และ endsAt ต้องเป็นเวลาแบบ ISO 8601");
  const id = check(
    await db().rpc("create_meeting", {
      channel,
      title: input.title ?? "",
      agenda: input.agenda,
      starts_at: input.startsAt ?? "",
      ends_at: input.endsAt ?? "",
    }),
  );
  return meetingOrThrow(id);
}

// ── ห้องเสียง ────────────────────────────────────────────────────────────

async function iceServers(): Promise<IceServer[]> {
  return check(await db().rpc("ice_servers")) as unknown as IceServer[];
}

async function joinVoice(raw: unknown): Promise<JoinVoiceResponse> {
  const channel = channelId(body<{ channelId: string }>(raw).channelId);
  const [session, ice] = await Promise.all([
    db().rpc("join_voice", { channel }).then(check),
    iceServers(),
  ]);
  const joined = session as unknown as VoiceSession;
  // subscribe to the session's signalling topic before anyone can send us an offer
  await enterVoice(joined.id);
  return {
    ...joined,
    iceServers: ice,
    // turns: (TLS) counts too — it is what gets through strict firewalls
    turnAvailable: ice.some((server) =>
      server.urls.some((u) => u.startsWith("turn:") || u.startsWith("turns:")),
    ),
    maxScreenViewers: 4,
  };
}

async function setVoiceState(session: string, raw: unknown): Promise<VoiceOccupants> {
  const input = body<{ muted: boolean; deafened: boolean; video: boolean }>(raw);
  const flag = (value: unknown) => (typeof value === "boolean" ? value : undefined);
  return check(
    await db().rpc("set_voice_state", {
      session,
      muted: flag(input.muted),
      deafened: flag(input.deafened),
      video: flag(input.video),
    }),
  ) as unknown as VoiceOccupants;
}

async function feedback(raw: unknown) {
  const input = body<{ channelId: string; rating: number; durationSec: number; kind: string }>(raw);
  const channel = channelId(input.channelId);
  if (!Number.isInteger(input.rating) || (input.rating ?? 0) < 1 || (input.rating ?? 0) > 5)
    throw badRequest("rating ต้องเป็น 1-5");
  if (input.kind !== "AUDIO" && input.kind !== "VIDEO")
    throw badRequest("kind ต้องเป็น AUDIO หรือ VIDEO");
  const row = check(
    await db()
      .from("call_feedback")
      .insert({
        channel_id: channel,
        rating: input.rating ?? 0,
        duration_sec:
          typeof input.durationSec === "number"
            ? Math.min(Math.max(Math.round(input.durationSec), 0), 86_400)
            : null,
        kind: input.kind,
      })
      .select("*")
      .single(),
  );
  return {
    id: row.id,
    channelId: row.channel_id,
    coreUserId: row.user_id,
    rating: row.rating,
    durationSec: row.duration_sec,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

async function feedbackList(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const {
    data: rows,
    error,
    count,
  } = await db()
    .from("call_feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  return {
    data: rows.map((row) => ({
      id: row.id,
      channelId: row.channel_id,
      coreUserId: row.user_id,
      rating: row.rating,
      durationSec: row.duration_sec,
      kind: row.kind,
      createdAt: row.created_at,
    })),
    meta: meta(page, limit, count ?? 0),
  };
}

export const VOICE_ROUTES: Route[] = [
  ["GET", /^\/meetings$/, ({ query }) => listMeetings(query)],
  ["POST", /^\/meetings$/, ({ body: raw }) => data(createMeeting(raw))],
  ["GET", /^\/meetings\/([^/]+)$/, ({ params: [m] }) => data(meetingOrThrow(meetingId(m)))],
  [
    "DELETE",
    /^\/meetings\/([^/]+)$/,
    async ({ params: [m] }) => {
      const meeting = meetingId(m);
      ok(await db().rpc("cancel_meeting", { meeting }));
      return data(meetingOrThrow(meeting));
    },
  ],

  ["GET", /^\/voice-sessions\/ice-servers$/, () => data(iceServers())],
  [
    "GET",
    /^\/voice-sessions$/,
    async ({ query }) => {
      const raw = query.get("channelId");
      const channel = raw ? channelId(raw) : undefined;
      return { data: check(await db().rpc("voice_sessions_list", { channel })) };
    },
  ],
  ["POST", /^\/voice-sessions$/, ({ body: raw }) => data(joinVoice(raw))],
  [
    "PATCH",
    /^\/voice-sessions\/([^/]+)\/participants\/me$/,
    ({ params: [s], body: raw }) => data(setVoiceState(sessionId(s), raw)),
  ],
  [
    "DELETE",
    /^\/voice-sessions\/([^/]+)\/participants\/me$/,
    async ({ params: [s] }) => {
      const session = sessionId(s);
      exitVoice(session);
      ok(await db().rpc("leave_voice", { session }));
      return { data: {} };
    },
  ],

  ["POST", /^\/calls\/feedback$/, ({ body: raw }) => data(feedback(raw))],
  ["GET", /^\/calls\/feedback$/, ({ query }) => feedbackList(query)],
];
