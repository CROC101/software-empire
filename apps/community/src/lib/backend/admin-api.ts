/// แผงผู้ดูแล: ภาพรวม · รายงาน · สมาชิก (สิทธิ์ + โควตา) · บันทึกการตรวจสอบ (community รอบ 7)
/// ฟังก์ชัน SQL ตรวจว่าเป็นผู้ดูแล (is_staff) ทุกครั้ง — หน้าบ้านซ่อนเมนูได้ แต่ไม่ใช่ตัวกันสิทธิ์
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
  ok,
  paging,
  type Route,
  userId,
} from "./api-core";
import type { AdminOverview, AuditLog, Layer2Role, Report, SubsystemMember } from "./types";

type ReportRow = Database["community"]["Tables"]["reports"]["Row"];

const REPORT_KINDS = new Set(["REEL", "POST", "MESSAGE", "COMMENT", "USER", "SYSTEM"]);
const STATUSES = new Set(["OPEN", "RESOLVED", "REJECTED"]);
const ROLES = new Set<Layer2Role>(["GUEST", "EDITOR", "ADMIN"]);

const toReport = (row: ReportRow): Report => ({
  id: row.id,
  targetKind: row.target_kind,
  targetId: row.target_id,
  reason: row.reason,
  status: row.status as Report["status"],
  reporterCoreUserId: row.reporter_id,
  resolvedByCoreUserId: row.resolved_by,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
});

async function reportOrThrow(id: string): Promise<Report> {
  return toReport(check(await db().from("reports").select("*").eq("id", id).single()));
}

async function createReport(raw: unknown) {
  const input = body<{ targetKind: string; targetId: string; reason: string }>(raw);
  if (!input.targetKind || !REPORT_KINDS.has(input.targetKind))
    throw badRequest("targetKind ต้องเป็น REEL, POST, MESSAGE, COMMENT, USER หรือ SYSTEM");
  const id = check(
    await db().rpc("create_report", {
      target_kind: input.targetKind,
      target_id: input.targetId ?? "",
      reason: input.reason ?? "",
    }),
  );
  return reportOrThrow(id);
}

/** mine = my own reports (any status) · otherwise the staff queue, oldest first (FIFO). */
async function listReports(query: URLSearchParams, mine: boolean) {
  const { page, limit, from, to } = paging(query);
  const status = query.get("status") ?? (mine ? null : "OPEN");
  const kind = query.get("targetKind");
  if (status && !STATUSES.has(status))
    throw badRequest("status ต้องเป็น OPEN, RESOLVED หรือ REJECTED");
  if (kind && !REPORT_KINDS.has(kind)) throw badRequest("targetKind ไม่ถูกต้อง");
  let request = db().from("reports").select("*", { count: "exact" });
  if (mine) request = request.eq("reporter_id", await myId());
  if (status) request = request.eq("status", status);
  if (kind) request = request.eq("target_kind", kind);
  const {
    data: rows,
    error,
    count,
  } = await request.order("created_at", { ascending: !mine }).order("id").range(from, to);
  if (error) throw fromPostgrest(error);
  return { data: rows.map(toReport), meta: meta(page, limit, count ?? 0) };
}

async function resolveReport(id: string, raw: unknown) {
  const input = body<{ status: string; note: string }>(raw);
  if (input.status !== "RESOLVED" && input.status !== "REJECTED")
    throw badRequest("status ต้องเป็น RESOLVED หรือ REJECTED");
  ok(await db().rpc("resolve_report", { report: id, status: input.status, note: input.note }));
  return reportOrThrow(id);
}

async function listMembers(query: URLSearchParams) {
  const { page, limit, from } = paging(query);
  const role = query.get("layer2Role");
  if (role && !ROLES.has(role as Layer2Role))
    throw badRequest("layer2Role ต้องเป็น GUEST, EDITOR หรือ ADMIN");
  const rows = check(
    await db().rpc("member_rows", {
      q: query.get("q") ?? undefined,
      role: role ?? undefined,
      skip: from,
      max_rows: limit,
    }),
  );
  return {
    data: rows.map((row) => row.member as unknown as SubsystemMember),
    meta: meta(page, limit, rows[0]?.total ?? 0),
  };
}

async function auditLogs(query: URLSearchParams) {
  const { page, limit, from, to } = paging(query);
  const actor = query.get("actorCoreUserId");
  const action = query.get("action");
  const since = query.get("since");
  const until = query.get("until");
  for (const [name, value] of [
    ["since", since],
    ["until", until],
  ] as const)
    if (value && Number.isNaN(Date.parse(value)))
      throw badRequest(`${name} ต้องเป็นเวลาแบบ ISO 8601`);
  if (since && until && Date.parse(since) > Date.parse(until))
    throw badRequest("since ต้องมาก่อน until");
  let request = db().from("audit_logs").select("*", { count: "exact" });
  if (actor) request = request.eq("actor_id", userId(actor));
  if (action) request = request.eq("action", action.slice(0, 64));
  if (since) request = request.gte("created_at", since);
  if (until) request = request.lte("created_at", until);
  const {
    data: rows,
    error,
    count,
  } = await request.order("created_at", { ascending: false }).range(from, to);
  if (error) throw fromPostgrest(error);
  const actors = [...new Set(rows.flatMap((row) => (row.actor_id ? [row.actor_id] : [])))];
  const roles = new Map(
    actors.length
      ? check(await db().from("profiles").select("user_id,role").in("user_id", actors)).map((p) => [
          p.user_id,
          p.role,
        ])
      : [],
  );
  return {
    data: rows.map((row): AuditLog => ({
      id: row.id,
      actorCoreUserId: row.actor_id ?? "",
      actorCoreRole: (row.actor_id && roles.get(row.actor_id)) ?? "",
      action: row.action,
      targetKind: row.target_kind ?? "",
      targetId: row.target_id ?? "",
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.created_at,
    })),
    meta: meta(page, limit, count ?? 0),
  };
}

const memberRoute = (suffix: "role" | "storage-quota"): Route => [
  "PATCH",
  new RegExp(`^/subsystem-members/([^/]+)/${suffix}$`),
  async ({ params: [u], body: raw }) => {
    const target = userId(u);
    const input = body<{ layer2Role: string; storageQuotaBytes: number; reason: string }>(raw);
    if (suffix === "role") {
      if (!ROLES.has(input.layer2Role as Layer2Role))
        throw badRequest("layer2Role ต้องเป็น GUEST, EDITOR หรือ ADMIN");
      return {
        data: check(
          await db().rpc("set_member_role", {
            target,
            role: input.layer2Role ?? "",
            reason: input.reason,
          }),
        ),
      };
    }
    if (!Number.isInteger(input.storageQuotaBytes))
      throw badRequest("storageQuotaBytes ต้องเป็นจำนวนเต็มไบต์");
    return {
      data: check(
        await db().rpc("set_member_quota", {
          target,
          quota_bytes: input.storageQuotaBytes ?? 0,
          reason: input.reason,
        }),
      ),
    };
  },
];

export const ADMIN_ROUTES: Route[] = [
  [
    "GET",
    /^\/admin-overview$/,
    async () => ({ data: check(await db().rpc("admin_overview")) as unknown as AdminOverview }),
  ],
  ["GET", /^\/subsystem-members$/, ({ query }) => listMembers(query)],
  memberRoute("role"),
  memberRoute("storage-quota"),
  ["POST", /^\/reports$/, ({ body: raw }) => data(createReport(raw))],
  ["GET", /^\/reports\/mine$/, ({ query }) => listReports(query, true)],
  ["GET", /^\/reports$/, ({ query }) => listReports(query, false)],
  [
    "PATCH",
    /^\/reports\/([^/]+)$/,
    ({ params: [r], body: raw }) => data(resolveReport(idParam(r, "รายงานนี้"), raw)),
  ],
  ["GET", /^\/audit-logs$/, ({ query }) => auditLogs(query)],
];
