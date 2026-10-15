/// ส่วนกลางของชั้นข้อมูล: ข้อผิดพลาด · ตัวช่วยอ่าน query/body · ชนิดของตารางเส้นทาง
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

export const notAvailable = () =>
  new ApiError(501, "NOT_AVAILABLE", "ส่วนนี้กำลังย้ายมาจากระบบเดิม ยังไม่เปิดใช้");
export const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `ไม่พบ${what}`);
export const badRequest = (message: string) => new ApiError(400, "VALIDATION_ERROR", message);

export function fromPostgrest(error: PostgrestError): ApiError {
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

export function check<T>(result: { data: T; error: PostgrestError | null }): NonNullable<T> {
  if (result.error) throw fromPostgrest(result.error);
  if (result.data == null)
    throw new ApiError(500, "INTERNAL_ERROR", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  return result.data;
}

/** For writes where "no row came back" is fine. */
export function ok(result: { error: PostgrestError | null }): void {
  if (result.error) throw fromPostgrest(result.error);
}

export async function myId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) {
    onUnauthorized?.();
    throw new ApiError(401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ");
  }
  return id;
}

// ── ตัวช่วยอ่าน query / body ──────────────────────────────────────────────

export function paging(query: URLSearchParams, fallbackLimit = 20) {
  const limit = Math.min(Math.max(Number(query.get("limit")) || fallbackLimit, 1), 100);
  const page = Math.max(Number(query.get("page")) || 1, 1);
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

export const meta = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

export function body<T extends object>(value: unknown): Partial<T> {
  return value && typeof value === "object" ? value : {};
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every coreUserId here is a Supabase user id; anything else cannot exist. */
export function userId(raw: string | undefined): string {
  const id = decodeURIComponent(raw ?? "");
  if (!UUID.test(id)) throw notFound("ผู้ใช้นี้");
  return id.toLowerCase();
}

// ── ตารางเส้นทาง ─────────────────────────────────────────────────────────

export type Result = { data: unknown; meta?: PaginationMeta };
export type Ctx = { params: string[]; query: URLSearchParams; body: unknown };
export type Route = [method: string, pattern: RegExp, handler: (ctx: Ctx) => Promise<Result>];

export const data = async <T>(promise: Promise<T>): Promise<Result> => ({ data: await promise });
