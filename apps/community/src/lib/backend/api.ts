/// ตัวเรียกข้อมูลของ Empire Community — จุดเดียวที่หน้าบ้านคุยกับข้อมูล
///
/// csmju-nexus เรียก REST ของ NestJS ผ่าน `api.get('/profiles/…')` ทั่วทั้งแอป Empire ไม่มีหลังบ้านนั้น
/// ไฟล์นี้เก็บ API เดิมไว้ทุกตัว แล้วจับคู่ path ไปทำงานกับ schema `community` ของ Supabase
/// กติกาความเป็นส่วนตัว (บล็อก · ใครเห็นอะไร) อยู่ใน RLS และฟังก์ชัน SQL ไม่ใช่ในไฟล์นี้
/// path ที่ยังไม่ย้ายตอบ 501 พร้อมข้อความภาษาไทย — ย้ายทีละกลุ่ม (ดู docs/MASTER-SPEC.md Roadmap)
import type { Database } from "@empire/core/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { db, supabase } from "@/lib/supabase";
import type {
  AudienceCounts,
  FollowEdge,
  Layer2Role,
  Me,
  MyProfile,
  PrivacySettings,
  ProfileDetail,
  ProfileSummary,
  Relation,
  Suggestion,
  SubsystemMember,
} from "./types";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUserFixable(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }

  const query = search.toString();

  return query ? `?${query}` : "";
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

// ── ข้อผิดพลาด ───────────────────────────────────────────────────────────

const notAvailable = () =>
  new ApiError(501, "NOT_AVAILABLE", "ส่วนนี้กำลังย้ายมาจากระบบเดิม ยังไม่เปิดใช้");
const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `ไม่พบ${what}`);
const badRequest = (message: string) => new ApiError(400, "VALIDATION_ERROR", message);

function fromPostgrest(error: PostgrestError): ApiError {
  if (error.code === "42501") return new ApiError(403, "FORBIDDEN", "คุณทำรายการนี้ไม่ได้");
  if (error.code === "23514") return badRequest("ข้อมูลไม่ถูกต้อง");
  if (error.code === "23505") return new ApiError(409, "CONFLICT", "รายการนี้มีอยู่แล้ว");
  // RAISE ในฟังก์ชัน SQL เขียนข้อความภาษาไทยไว้แล้ว
  if (error.code === "P0001") return badRequest(error.message);
  if (error.code === "PGRST301" || error.code === "PGRST303") {
    onUnauthorized?.();
    return new ApiError(401, "UNAUTHORIZED", "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
  }
  return new ApiError(500, "INTERNAL_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
}

function check<T>(result: { data: T; error: PostgrestError | null }): NonNullable<T> {
  if (result.error) throw fromPostgrest(result.error);
  if (result.data == null)
    throw new ApiError(500, "INTERNAL_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  return result.data;
}

/** For writes where "no row came back" is fine. */
function ok(result: { error: PostgrestError | null }): void {
  if (result.error) throw fromPostgrest(result.error);
}

async function myId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) {
    onUnauthorized?.();
    throw new ApiError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ");
  }
  return id;
}

// ── ตัวช่วยอ่าน query / body ──────────────────────────────────────────────

function paging(query: URLSearchParams, fallbackLimit = 20) {
  const limit = Math.min(Math.max(Number(query.get("limit")) || fallbackLimit, 1), 100);
  const page = Math.max(Number(query.get("page")) || 1, 1);
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

const meta = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

function body<T extends object>(value: unknown): Partial<T> {
  return value && typeof value === "object" ? value : {};
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every coreUserId here is a Supabase user id; anything else cannot exist. */
function userId(raw: string | undefined): string {
  const id = decodeURIComponent(raw ?? "");
  if (!UUID.test(id)) throw notFound("ผู้ใช้นี้");
  return id.toLowerCase();
}

// ── โปรไฟล์ ───────────────────────────────────────────────────────────────

const PROFILE_COLUMNS = "user_id,display_name,avatar_url,cover_url,bio,website,role,created_at";

type ProfileRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  website: string | null;
  role: string;
  created_at: string;
};

const badgeOf = (role: string): ProfileSummary["badge"] => (role === "ADMIN" ? "ADMIN" : null);

const toSummary = (row: ProfileRow): ProfileSummary => ({
  coreUserId: row.user_id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
  syncedAt: row.created_at,
  badge: badgeOf(row.role),
});

async function relationWith(me: string, target: string): Promise<Relation> {
  if (me === target)
    return { following: false, followedBy: false, mutual: false, blockedByMe: false };
  const [links, blocked] = await Promise.all([
    db()
      .from("follows")
      .select("follower_id,followee_id")
      .or(
        `and(follower_id.eq.${me},followee_id.eq.${target}),and(follower_id.eq.${target},followee_id.eq.${me})`,
      ),
    db().from("blocks").select("blocked_id").eq("blocker_id", me).eq("blocked_id", target),
  ]);
  const rows = check(links);
  const following = rows.some((r) => r.follower_id === me);
  const followedBy = rows.some((r) => r.follower_id === target);
  return {
    following,
    followedBy,
    mutual: following && followedBy,
    blockedByMe: check(blocked).length > 0,
  };
}

async function profileDetail(target: string): Promise<ProfileDetail> {
  const me = await myId();
  const [row, stats, relation] = await Promise.all([
    db().from("profiles").select(PROFILE_COLUMNS).eq("user_id", target).maybeSingle(),
    db()
      .from("profile_stats")
      .select("follower_count,following_count")
      .eq("user_id", target)
      .maybeSingle(),
    relationWith(me, target),
  ]);
  if (row.error) throw fromPostgrest(row.error);
  // a profile that blocked me is hidden by RLS — it looks exactly like one that doesn't exist
  if (!row.data) throw notFound("ผู้ใช้นี้");
  const p = row.data;
  return {
    ...toSummary(p),
    // shortcut: post/reel counts arrive with the feed and reels rounds
    stats: {
      reelCount: 0,
      postCount: 0,
      followerCount: stats.data?.follower_count ?? 0,
      followingCount: stats.data?.following_count ?? 0,
    },
    relation,
    layer2Role: p.role,
    joinedAt: p.created_at,
    bio: p.bio,
    coverUrl: p.cover_url,
    website: p.website,
  };
}

async function resolveProfiles(query: URLSearchParams) {
  const ids = (query.get("coreUserIds") ?? "")
    .split(",")
    .filter((id) => UUID.test(id))
    .slice(0, 100);
  if (ids.length === 0) return { data: [] };
  const rows = check(await db().from("profiles").select(PROFILE_COLUMNS).in("user_id", ids));
  return { data: rows.map(toSummary) };
}

async function myProfile(): Promise<MyProfile> {
  return { ...(await profileDetail(await myId())), managedByCore: [] };
}

async function updateMyProfile(raw: unknown): Promise<MyProfile> {
  const input = body<{
    bio: string | null;
    website: string | null;
    displayName: string;
    coverAssetId: string | null;
  }>(raw);
  // cover photos need uploads, which arrive with the feed round
  if (input.coverAssetId !== undefined) throw notAvailable();
  const patch: Database["community"]["Tables"]["profiles"]["Update"] = {};
  if (input.bio !== undefined) patch.bio = input.bio?.trim() || null;
  if (input.website !== undefined) patch.website = input.website?.trim() || null;
  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  ok(
    await db()
      .from("profiles")
      .update(patch)
      .eq("user_id", await myId()),
  );
  return myProfile();
}

// ── ติดตาม · บล็อก · เพื่อนสนิท ───────────────────────────────────────────

async function followEdges(
  column: "follower_id" | "followee_id",
  owner: string,
  query: URLSearchParams,
) {
  const { page, limit, from, to } = paging(query);
  const other = column === "follower_id" ? "followee_id" : "follower_id";
  const { data, error, count } = await db()
    .from("follows")
    .select("follower_id,followee_id,created_at", { count: "exact" })
    .eq(column, owner)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const items: FollowEdge[] = data.map((r) => ({ coreUserId: r[other], createdAt: r.created_at }));
  return { data: items, meta: meta(page, limit, count ?? 0) };
}

async function follow(raw: unknown): Promise<Relation> {
  const me = await myId();
  const target = userId(body<{ coreUserId: string }>(raw).coreUserId);
  if (target === me) throw badRequest("ติดตามตัวเองไม่ได้");
  const { error } = await db().from("follows").insert({ follower_id: me, followee_id: target });
  // already following is fine; a block shows up as 42501 from RLS
  if (error && error.code !== "23505") {
    throw error.code === "42501"
      ? new ApiError(403, "FORBIDDEN", "ติดตามคนนี้ไม่ได้")
      : fromPostgrest(error);
  }
  return relationWith(me, target);
}

async function unfollow(target: string): Promise<Relation> {
  const me = await myId();
  ok(await db().from("follows").delete().eq("follower_id", me).eq("followee_id", target));
  return relationWith(me, target);
}

async function suggestions(query: URLSearchParams) {
  const { page, limit } = paging(query, 20);
  // ranked server-side; paging past the first page returns nothing new
  const rows = page > 1 ? [] : check(await db().rpc("follow_suggestions", { max_rows: limit }));
  const items: Suggestion[] = rows.map((r) => ({
    coreUserId: r.user_id,
    followedBy: r.followed_by,
    followedByCount: r.followed_by_count,
    mutualCount: r.mutual_count,
  }));
  return { data: items, meta: meta(page, limit, items.length) };
}

async function audienceCounts(): Promise<AudienceCounts> {
  const me = await myId();
  const [following, followers] = await Promise.all([
    db().from("follows").select("followee_id").eq("follower_id", me),
    db().from("follows").select("follower_id").eq("followee_id", me),
  ]);
  const out = new Set(check(following).map((r) => r.followee_id));
  const ins = check(followers).map((r) => r.follower_id);
  return {
    following: out.size,
    followers: ins.length,
    mutual: ins.filter((id) => out.has(id)).length,
  };
}

async function listIdsOf(table: "blocks" | "close_friends", query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const [owner, other] =
    table === "blocks" ? ["blocker_id", "blocked_id"] : ["owner_id", "friend_id"];
  const { data, error, count } = await db()
    .from(table)
    .select(`${other},created_at`, { count: "exact" })
    .eq(owner, await myId())
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrest(error);
  const rows = data as unknown as Record<string, string>[];
  return {
    data: rows.map((r) => ({ coreUserId: r[other], createdAt: r.created_at })),
    meta: meta(page, limit, count ?? 0),
  };
}

// ── ตั้งค่าความเป็นส่วนตัว · สมาชิก ───────────────────────────────────────

async function privacy(): Promise<PrivacySettings> {
  const row = check(
    await db()
      .from("profiles")
      .select("comments_from,show_activity_status,show_in_suggestions")
      .eq("user_id", await myId())
      .single(),
  );
  return {
    commentsFrom: row.comments_from as PrivacySettings["commentsFrom"],
    showActivityStatus: row.show_activity_status,
    showInSuggestions: row.show_in_suggestions,
  };
}

async function updatePrivacy(raw: unknown): Promise<PrivacySettings> {
  const input = body<PrivacySettings>(raw);
  const patch: Database["community"]["Tables"]["profiles"]["Update"] = {};
  if (input.commentsFrom !== undefined) patch.comments_from = input.commentsFrom;
  if (input.showActivityStatus !== undefined) patch.show_activity_status = input.showActivityStatus;
  if (input.showInSuggestions !== undefined) patch.show_in_suggestions = input.showInSuggestions;
  ok(
    await db()
      .from("profiles")
      .update(patch)
      .eq("user_id", await myId()),
  );
  return privacy();
}

async function memberMe(): Promise<SubsystemMember & Me> {
  const me = await myId();
  const row = check(
    await db().from("profiles").select("role,created_at,updated_at").eq("user_id", me).single(),
  );
  const role = row.role as Layer2Role;
  return {
    coreUserId: me,
    coreRole: "student",
    layer2Role: role,
    layer2RoleExplicit: role !== "EDITOR",
    // shortcut: storage numbers arrive with uploads (feed round)
    storageUsedBytes: "0",
    storageQuotaBytes: String(50 * 1024 * 1024),
    storageUsedPercent: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

type Result = { data: unknown; meta?: PaginationMeta };
type Ctx = { params: string[]; query: URLSearchParams; body: unknown };
type Route = [method: string, pattern: RegExp, handler: (ctx: Ctx) => Promise<Result>];

const data = async <T>(promise: Promise<T>): Promise<Result> => ({ data: await promise });

const ROUTES: Route[] = [
  ["GET", /^\/profiles$/, ({ query }) => resolveProfiles(query)],
  ["GET", /^\/profiles\/me$/, () => data(myProfile())],
  ["PATCH", /^\/profiles\/me$/, ({ body: raw }) => data(updateMyProfile(raw))],
  ["GET", /^\/profiles\/([^/]+)$/, ({ params: [id] }) => data(profileDetail(userId(id)))],
  [
    "GET",
    /^\/profiles\/([^/]+)\/followers$/,
    ({ params: [id], query }) => followEdges("followee_id", userId(id), query),
  ],
  [
    "GET",
    /^\/profiles\/([^/]+)\/following$/,
    ({ params: [id], query }) => followEdges("follower_id", userId(id), query),
  ],
  [
    "GET",
    /^\/follows\/followers$/,
    async ({ query }) => followEdges("followee_id", await myId(), query),
  ],
  [
    "GET",
    /^\/follows\/following$/,
    async ({ query }) => followEdges("follower_id", await myId(), query),
  ],
  ["GET", /^\/follows\/suggestions$/, ({ query }) => suggestions(query)],
  ["POST", /^\/follows$/, ({ body: raw }) => data(follow(raw))],
  ["DELETE", /^\/follows\/([^/]+)$/, ({ params: [id] }) => data(unfollow(userId(id)))],
  ["GET", /^\/blocks$/, ({ query }) => listIdsOf("blocks", query)],
  [
    "POST",
    /^\/blocks$/,
    async ({ body: raw }) => {
      const target = userId(body<{ coreUserId: string }>(raw).coreUserId);
      const createdAt = check(await db().rpc("block_user", { target }));
      return { data: { coreUserId: target, createdAt } };
    },
  ],
  [
    "DELETE",
    /^\/blocks\/([^/]+)$/,
    async ({ params: [id] }) => {
      const target = userId(id);
      ok(
        await db()
          .from("blocks")
          .delete()
          .eq("blocker_id", await myId())
          .eq("blocked_id", target),
      );
      return { data: {} };
    },
  ],
  ["GET", /^\/close-friends$/, ({ query }) => listIdsOf("close_friends", query)],
  [
    "PUT",
    /^\/close-friends\/([^/]+)$/,
    async ({ params: [id] }) => {
      const friend = userId(id);
      const { error } = await db()
        .from("close_friends")
        .insert({ owner_id: await myId(), friend_id: friend });
      if (error && error.code !== "23505") throw fromPostgrest(error);
      return { data: {} };
    },
  ],
  [
    "DELETE",
    /^\/close-friends\/([^/]+)$/,
    async ({ params: [id] }) => {
      const friend = userId(id);
      ok(
        await db()
          .from("close_friends")
          .delete()
          .eq("owner_id", await myId())
          .eq("friend_id", friend),
      );
      return { data: {} };
    },
  ],
  ["GET", /^\/me\/audience-counts$/, () => data(audienceCounts())],
  ["GET", /^\/me\/privacy$/, () => data(privacy())],
  ["PATCH", /^\/me\/privacy$/, ({ body: raw }) => data(updatePrivacy(raw))],
  ["GET", /^\/subsystem-members\/me$/, () => data(memberMe())],
];

async function request<T>(
  method: string,
  path: string,
  payload?: unknown,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const url = new URL(path, "http://local");
  for (const [routeMethod, pattern, handler] of ROUTES) {
    const match = routeMethod === method ? pattern.exec(url.pathname) : null;
    if (match) {
      const result = await handler({
        params: match.slice(1),
        query: url.searchParams,
        body: payload,
      });
      return result as { data: T; meta?: PaginationMeta };
    }
  }
  throw notAvailable();
}

export const api = {
  async get<T>(path: string): Promise<T> {
    return (await request<T>("GET", path)).data;
  },

  async list<T>(path: string): Promise<Page<T>> {
    const { data: items, meta: pageMeta } = await request<T[]>("GET", path);
    const list = Array.isArray(items) ? items : [];
    return { items: list, meta: pageMeta ?? meta(1, list.length, list.length) };
  },

  async post<T>(path: string, payload?: unknown): Promise<T> {
    return (await request<T>("POST", path, payload)).data;
  },

  async patch<T>(path: string, payload?: unknown): Promise<T> {
    return (await request<T>("PATCH", path, payload)).data;
  },

  async put<T>(path: string, payload?: unknown): Promise<T> {
    return (await request<T>("PUT", path, payload)).data;
  },

  async del<T>(path: string): Promise<T> {
    return (await request<T>("DELETE", path)).data;
  },
};
