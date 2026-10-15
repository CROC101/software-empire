/// ตัวเรียกข้อมูลของ Empire Canvas — จุดเดียวที่หน้าบ้านคุยกับข้อมูล
///
/// csmju-canvas เรียก REST ของ NestJS ผ่าน `api.get('/designs/…')` ทั่วทั้งแอป Empire ไม่มีหลังบ้านนั้น
/// ไฟล์นี้จึงเก็บ API เดิมไว้ทุกตัว (get · list · post · patch · put · upload · del) แล้วจับคู่ path
/// ไปทำงานกับ Supabase โดยตรง — ความปลอดภัยอยู่ที่ RLS ของ schema `canva` ไม่ใช่ที่ไฟล์นี้
/// path ที่ยังไม่รองรับตอบ 501 พร้อมข้อความภาษาไทย หน้าจอเดิมแสดง ErrorState ได้เองอยู่แล้ว
import type { Database } from "@empire/core/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { isSvgFile, rasterizeSvgFile } from "@/lib/svg-raster";
import { ASSET_BUCKET, assetContentUrl, supabase } from "@/lib/supabase";
import type {
  Asset,
  Design,
  DesignSummary,
  DesignTypeUsage,
  Folder,
  Preference,
  Quota,
  Template,
  TemplateSummary,
} from "@/lib/types";
import type { DesignDocument } from "@/lib/editor/types";
import { BUILTIN_TEMPLATES, type BuiltinTemplate } from "./builtin-templates";

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

/// ต่อ query string โดยตัด key ที่เป็น undefined หรือว่างออก
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

const NOT_AVAILABLE = "ฟีเจอร์นี้ยังไม่เปิดใน Empire Canvas";
const notAvailable = () => new ApiError(501, "NOT_AVAILABLE", NOT_AVAILABLE);
const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `ไม่พบ${what} อาจถูกลบไปแล้ว`);
const badRequest = (message: string) => new ApiError(400, "VALIDATION_ERROR", message);

function fromPostgrest(error: PostgrestError): ApiError {
  if (error.code === "42501") return new ApiError(403, "FORBIDDEN", "คุณไม่มีสิทธิ์ทำรายการนี้");
  if (error.code === "23514") return badRequest("ข้อมูลไม่ถูกต้องหรือใหญ่เกินกำหนด");
  // RAISE จาก trigger (เช่นโควตาเต็ม) เขียนข้อความภาษาไทยไว้แล้ว
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

/** For maybeSingle(): null means "no such row (or not yours)" and becomes a 404 at the caller. */
function maybe<T>(result: { data: T | null; error: PostgrestError | null }): T | null {
  if (result.error) throw fromPostgrest(result.error);
  return result.data;
}

// ── แปลงแถวในฐาน → รูปร่างที่หน้าจอเดิมใช้ ──────────────────────────────

type DesignRow = Database["canva"]["Tables"]["designs"]["Row"];
type AssetRow = Database["canva"]["Tables"]["assets"]["Row"];

const DESIGN_SUMMARY_COLUMNS =
  "id,title,design_type,width,height,thumbnail,folder_id,source_template_id,tags,starred_at,trashed_at,created_at,updated_at";

function toSummary(row: Omit<DesignRow, "document" | "user_id">): DesignSummary {
  return {
    id: row.id,
    title: row.title,
    designType: row.design_type,
    width: row.width,
    height: row.height,
    thumbnail: row.thumbnail,
    folderId: row.folder_id,
    sourceTemplateId: row.source_template_id,
    trashedAt: row.trashed_at,
    tags: row.tags,
    // link sharing is not ported: every design is private to its owner
    linkAccess: "NONE",
    access: "OWNER",
    starred: row.starred_at !== null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const toDesign = (row: DesignRow): Design => ({
  ...toSummary(row),
  document: row.document as unknown as DesignDocument,
});

const toAsset = (row: AssetRow): Asset => ({
  id: row.id,
  fileName: row.file_name,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  contentUrl: assetContentUrl(row.id),
  folderId: null,
  trashedAt: row.trashed_at,
  sourceUrl: row.source_url,
  sourceSite: row.source_site,
  createdAt: row.created_at,
});

const BUILTIN_CREATED_AT = "2026-10-01T00:00:00.000Z";

function pageCountOf(document: Record<string, unknown>): number {
  return Array.isArray(document.pages) ? document.pages.length : 1;
}

function toTemplateSummary(t: BuiltinTemplate, starred: ReadonlySet<string>): TemplateSummary {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    designType: t.designType,
    category: t.category,
    width: t.width,
    height: t.height,
    thumbnail: null,
    usageCount: 0,
    isBuiltIn: true,
    isMine: false,
    isStarred: starred.has(t.id),
    pageCount: pageCountOf(t.document),
    createdAt: BUILTIN_CREATED_AT,
    updatedAt: BUILTIN_CREATED_AT,
  };
}

// ── ค่าที่เก็บในเบราว์เซอร์ (ไม่ใช่ข้อมูลสำคัญ) ──────────────────────────

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as object) } : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: works for this page only
  }
}

const PREFERENCES_KEY = "empire-canva:preferences";
const DEFAULT_PREFERENCES: Preference = {
  aboutMe: "",
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  notifyTemplateUsed: false,
  notifyTrash: false,
  theme: "SYSTEM",
  updatedAt: BUILTIN_CREATED_AT,
};

const STARRED_TEMPLATES_KEY = "empire-canva:starred-templates";
const starredTemplates = () =>
  new Set(readLocal<{ ids: string[] }>(STARRED_TEMPLATES_KEY, { ids: [] }).ids);

// ── ตัวช่วยอ่าน query ────────────────────────────────────────────────────

const flag = (query: URLSearchParams, key: string) => query.get(key) === "true";

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

/** `%` and `_` typed by the user must match literally in ILIKE. */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const EDITED_WITHIN_MS: Record<string, number> = {
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
  year: 365 * 86_400_000,
};

function body<T extends object>(value: unknown): Partial<T> {
  return value && typeof value === "object" ? value : {};
}

// ── ผู้ทำงานของแต่ละ path ────────────────────────────────────────────────

type Result = { data: unknown; meta?: PaginationMeta };
type Ctx = { params: string[]; query: URLSearchParams; body: unknown };
type Route = [method: string, pattern: RegExp, handler: (ctx: Ctx) => Promise<Result>];

const designs = () => supabase.schema("canva").from("designs");
const folders = () => supabase.schema("canva").from("folders");
const assets = () => supabase.schema("canva").from("assets");

async function listDesigns({ query }: Ctx): Promise<Result> {
  // "shared with me" needs link sharing, which is not ported
  if (query.get("scope") === "shared") return { data: [], meta: meta(1, 20, 0) };

  const { page, limit, from, to } = paging(query);
  const sort = query.get("sort");
  let request = designs()
    .select(DESIGN_SUMMARY_COLUMNS, { count: "exact" })
    .order(sort === "title" ? "title" : sort === "created" ? "created_at" : "updated_at", {
      ascending: sort === "title",
    })
    .range(from, to);

  request = flag(query, "trashed")
    ? request.not("trashed_at", "is", null)
    : request.is("trashed_at", null);
  if (flag(query, "starred")) request = request.not("starred_at", "is", null);
  const q = query.get("q")?.trim();
  if (q) request = request.ilike("title", likePattern(q));
  const designType = query.get("designType");
  const designTypes = query.get("designTypes");
  if (designType) request = request.eq("design_type", designType);
  else if (designTypes) request = request.in("design_type", designTypes.split(","));
  const folderId = query.get("folderId");
  if (folderId) request = request.eq("folder_id", folderId);
  const within = EDITED_WITHIN_MS[query.get("editedWithin") ?? ""];
  if (within) request = request.gte("updated_at", new Date(Date.now() - within).toISOString());

  const { data, error, count } = await request;
  if (error) throw fromPostgrest(error);
  return { data: data.map(toSummary), meta: meta(page, limit, count ?? 0) };
}

async function getDesign(id: string): Promise<Design> {
  const row = maybe(await designs().select("*").eq("id", id).maybeSingle());
  if (!row) throw notFound("งานนี้");
  return toDesign(row);
}

type CreateDesignBody = {
  title: string;
  designType: string;
  width: number;
  height: number;
  document: Record<string, unknown>;
  templateId: string;
  copyFromDesignId: string;
  folderId: string;
};

async function createDesign({ body: raw }: Ctx): Promise<Result> {
  const input = body<CreateDesignBody>(raw);
  let source: {
    title: string;
    designType: string;
    width: number;
    height: number;
    document: unknown;
  } | null = null;

  if (input.templateId) {
    const template = BUILTIN_TEMPLATES.find((t) => t.id === input.templateId);
    if (!template) throw notFound("เทมเพลตนี้");
    source = template;
  } else if (input.copyFromDesignId) {
    const original = await getDesign(input.copyFromDesignId);
    source = { ...original, title: `${original.title} (สำเนา)` };
  }

  const document = input.document ?? source?.document;
  const designType = input.designType ?? source?.designType;
  const width = input.width ?? source?.width;
  const height = input.height ?? source?.height;
  if (!document || !designType || !width || !height) throw badRequest("ข้อมูลงานไม่ครบ");

  const row = check(
    await designs()
      .insert({
        title: (input.title ?? source?.title ?? "งานไม่มีชื่อ").slice(0, 120) || "งานไม่มีชื่อ",
        design_type: designType,
        width,
        height,
        document: document as Database["canva"]["Tables"]["designs"]["Insert"]["document"],
        folder_id: input.folderId ?? null,
        source_template_id: input.templateId ?? null,
      })
      .select("*")
      .single(),
  );
  return { data: toDesign(row) };
}

type UpdateDesignBody = {
  title: string;
  document: Record<string, unknown>;
  width: number;
  height: number;
  thumbnail: string;
  folderId: string | null;
  trashed: boolean;
  tags: string[];
  linkAccess: string;
  starred: boolean;
};

async function updateDesign({ params: [id = ""], body: raw }: Ctx): Promise<Result> {
  const input = body<UpdateDesignBody>(raw);
  if (input.linkAccess !== undefined && input.linkAccess !== "NONE") throw notAvailable();

  const now = new Date().toISOString();
  const patch: Database["canva"]["Tables"]["designs"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.document !== undefined)
    patch.document = input.document as Database["canva"]["Tables"]["designs"]["Update"]["document"];
  if (input.width !== undefined) patch.width = input.width;
  if (input.height !== undefined) patch.height = input.height;
  if (input.thumbnail !== undefined) patch.thumbnail = input.thumbnail;
  if (input.folderId !== undefined) patch.folder_id = input.folderId;
  if (input.trashed !== undefined) patch.trashed_at = input.trashed ? now : null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.starred !== undefined) patch.starred_at = input.starred ? now : null;

  const row = maybe(await designs().update(patch).eq("id", id).select("*").maybeSingle());
  if (!row) throw notFound("งานนี้");
  return { data: toDesign(row) };
}

async function deleteDesign({ params: [id = ""] }: Ctx): Promise<Result> {
  const rows = check(await designs().delete().eq("id", id).select("id"));
  if (rows.length === 0) throw notFound("งานนี้");
  return { data: { id } };
}

async function designTypeUsages({ query }: Ctx): Promise<Result> {
  const rows = check(
    await designs()
      .select("design_type,updated_at")
      .is("trashed_at", null)
      .order("updated_at", { ascending: false })
      .limit(500),
  );
  const usage = new Map<string, DesignTypeUsage>();
  for (const row of rows) {
    const current = usage.get(row.design_type);
    if (current) current.count += 1;
    else
      usage.set(row.design_type, {
        designType: row.design_type,
        count: 1,
        lastUsedAt: row.updated_at,
      });
  }
  const { limit } = paging(query, 10);
  return { data: [...usage.values()].slice(0, limit) };
}

async function listFolders(): Promise<Result> {
  const rows = check(
    await folders().select("id,name,created_at,updated_at,designs(count)").order("name"),
  );
  const data: Folder[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    designCount: row.designs[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return { data };
}

async function saveFolder({ params: [id], body: raw }: Ctx): Promise<Result> {
  const name = body<{ name: string }>(raw).name?.trim();
  if (!name) throw badRequest("กรุณาตั้งชื่อโฟลเดอร์");
  const row = check(
    await (id ? folders().update({ name }).eq("id", id) : folders().insert({ name }))
      .select("*")
      .single(),
  );
  return {
    data: {
      id: row.id,
      name: row.name,
      designCount: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

async function deleteFolder({ params: [id = ""] }: Ctx): Promise<Result> {
  check(await folders().delete().eq("id", id));
  return { data: { id } };
}

const KIND_PREFIX: Record<string, string> = {
  image: "image/",
  video: "video/",
  audio: "audio/",
  font: "font/",
};

async function listAssets({ query }: Ctx): Promise<Result> {
  // asset folders and web-imported images are not ported
  if (query.get("folderId") || flag(query, "imported") || query.get("source"))
    return { data: [], meta: meta(1, 20, 0) };

  const { page, limit, from, to } = paging(query);
  const sort = query.get("sort");
  let request = assets()
    .select("*", { count: "exact" })
    .order(sort === "name" ? "file_name" : sort === "size" ? "size_bytes" : "created_at", {
      ascending: sort === "name",
    })
    .range(from, to);
  request = flag(query, "trashed")
    ? request.not("trashed_at", "is", null)
    : request.is("trashed_at", null);
  const prefix = KIND_PREFIX[query.get("kind") ?? ""];
  if (prefix) request = request.like("mime_type", `${prefix}%`);
  const mimeType = query.get("mimeType");
  if (mimeType)
    request = mimeType.endsWith("/")
      ? request.like("mime_type", `${mimeType}%`)
      : request.eq("mime_type", mimeType);
  const q = query.get("q")?.trim();
  if (q) request = request.ilike("file_name", likePattern(q));

  const { data, error, count } = await request;
  if (error) throw fromPostgrest(error);
  return { data: data.map(toAsset), meta: meta(page, limit, count ?? 0) };
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
]);
const FONT_BY_EXTENSION: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};
const MAX_ASSET_BYTES = 10 * 1024 * 1024;
const MAX_FONT_BYTES = 5 * 1024 * 1024;

/** Browsers often report fonts as application/octet-stream — fall back to the extension. */
function mimeOf(file: File): string {
  if (ALLOWED_MIME.has(file.type)) return file.type;
  return FONT_BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? file.type;
}

async function uploadAsset(file: File, fields: Record<string, string>): Promise<Asset> {
  const mimeType = mimeOf(file);
  if (!ALLOWED_MIME.has(mimeType))
    throw badRequest("รองรับเฉพาะรูป (PNG JPG WebP GIF) วิดีโอ เสียง และฟอนต์");
  const limit = mimeType.startsWith("font/") ? MAX_FONT_BYTES : MAX_ASSET_BYTES;
  if (file.size > limit) throw badRequest(`ไฟล์ใหญ่เกิน ${String(limit / 1024 / 1024)} MB`);

  // the row comes first: storage RLS only accepts bytes for an asset row you own
  const row = check(
    await assets()
      .insert({
        file_name: file.name.slice(0, 200) || "ไฟล์",
        mime_type: mimeType,
        size_bytes: file.size,
        source_url: fields.sourceUrl ?? null,
        source_site: fields.sourceSite ?? null,
      })
      .select("*")
      .single(),
  );
  const { error } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(row.id, file, { contentType: mimeType, upsert: false });
  if (error) {
    await assets().delete().eq("id", row.id);
    throw new ApiError(500, "UPLOAD_FAILED", "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่");
  }
  return toAsset(row);
}

async function updateAsset({ params: [id = ""], body: raw }: Ctx): Promise<Result> {
  const input = body<{ fileName: string; trashed: boolean; folderId: string | null }>(raw);
  if (input.folderId) throw notAvailable();
  const patch: Database["canva"]["Tables"]["assets"]["Update"] = {};
  if (input.fileName !== undefined) patch.file_name = input.fileName;
  if (input.trashed !== undefined)
    patch.trashed_at = input.trashed ? new Date().toISOString() : null;
  const row = maybe(await assets().update(patch).eq("id", id).select("*").maybeSingle());
  if (!row) throw notFound("ไฟล์นี้");
  return { data: toAsset(row) };
}

async function deleteAsset({ params: [id = ""] }: Ctx): Promise<Result> {
  // bytes first: their delete policy needs the asset row to still exist
  const { error } = await supabase.storage.from(ASSET_BUCKET).remove([id]);
  if (error) throw new ApiError(500, "DELETE_FAILED", "ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่");
  check(await assets().delete().eq("id", id));
  return { data: { id } };
}

async function quota(): Promise<Result> {
  const [assetRows, designCount, trashedCount] = await Promise.all([
    assets().select("size_bytes"),
    designs().select("id", { count: "exact", head: true }).is("trashed_at", null),
    designs().select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
  ]);
  const sizes = check(assetRows);
  const data: Quota = {
    usedBytes: sizes.reduce((sum, row) => sum + row.size_bytes, 0),
    quotaBytes: 50 * 1024 * 1024,
    assetCount: sizes.length,
    designCount: designCount.count ?? 0,
    trashedDesignCount: trashedCount.count ?? 0,
  };
  return { data };
}

function listTemplates({ query }: Ctx): Promise<Result> {
  // only built-in templates exist here; "mine"/"others" lists stay empty
  if (query.get("owner") && query.get("owner") !== "builtin")
    return Promise.resolve({ data: [], meta: meta(1, 20, 0) });

  const starred = starredTemplates();
  const q = query.get("q")?.trim().toLocaleLowerCase("th");
  const designType = query.get("designType");
  const category = query.get("category");
  const items = BUILTIN_TEMPLATES.filter(
    (t) =>
      (!q || `${t.title} ${t.description}`.toLocaleLowerCase("th").includes(q)) &&
      (!designType || t.designType === designType) &&
      (!category || t.category === category) &&
      (!flag(query, "starred") || starred.has(t.id)),
  );
  const { page, limit, from } = paging(query);
  return Promise.resolve({
    data: items.slice(from, from + limit).map((t) => toTemplateSummary(t, starred)),
    meta: meta(page, limit, items.length),
  });
}

function getTemplate({ params: [id] }: Ctx): Promise<Result> {
  const template = BUILTIN_TEMPLATES.find((t) => t.id === id);
  if (!template) return Promise.reject(notFound("เทมเพลตนี้"));
  const data: Template = {
    ...toTemplateSummary(template, starredTemplates()),
    document: template.document as unknown as DesignDocument,
  };
  return Promise.resolve({ data });
}

function starTemplate(templateId: string | undefined, on: boolean): Promise<Result> {
  if (!templateId) return Promise.reject(badRequest("ไม่ระบุเทมเพลต"));
  const ids = starredTemplates();
  if (on) ids.add(templateId);
  else ids.delete(templateId);
  writeLocal(STARRED_TEMPLATES_KEY, { ids: [...ids] });
  return Promise.resolve({ data: { templateId } });
}

const ok =
  (data: unknown = {}) =>
  () =>
    Promise.resolve({ data });

const ROUTES: Route[] = [
  ["GET", /^\/designs$/, listDesigns],
  ["POST", /^\/designs$/, createDesign],
  ["GET", /^\/designs\/([^/]+)$/, async ({ params: [id = ""] }) => ({ data: await getDesign(id) })],
  ["PATCH", /^\/designs\/([^/]+)$/, updateDesign],
  ["DELETE", /^\/designs\/([^/]+)$/, deleteDesign],
  ["GET", /^\/design-type-usages$/, designTypeUsages],
  ["GET", /^\/folders$/, listFolders],
  ["POST", /^\/folders$/, saveFolder],
  ["PATCH", /^\/folders\/([^/]+)$/, saveFolder],
  ["DELETE", /^\/folders\/([^/]+)$/, deleteFolder],
  ["GET", /^\/assets$/, listAssets],
  ["PATCH", /^\/assets\/([^/]+)$/, updateAsset],
  ["DELETE", /^\/assets\/([^/]+)$/, deleteAsset],
  ["GET", /^\/asset-folders$/, ok([])],
  ["GET", /^\/templates$/, listTemplates],
  ["GET", /^\/templates\/([^/]+)$/, getTemplate],
  [
    "POST",
    /^\/template-favorites$/,
    ({ body: raw }) => starTemplate(body<{ templateId: string }>(raw).templateId, true),
  ],
  ["DELETE", /^\/template-favorites\/([^/]+)$/, ({ params: [id] }) => starTemplate(id, false)],
  ["GET", /^\/quotas$/, quota],
  ["GET", /^\/preferences$/, ok()],
  ["PATCH", /^\/preferences$/, ok()],
  ["GET", /^\/notifications$/, ok([])],
  ["PATCH", /^\/notifications(\/[^/]+)?$/, ok()],
];

async function request<T>(
  method: string,
  path: string,
  payload?: unknown,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const url = new URL(path, "http://local");
  // preferences live in this browser (theme, contrast, text size)
  if (url.pathname === "/preferences") {
    const next = {
      ...readLocal(PREFERENCES_KEY, DEFAULT_PREFERENCES),
      ...body<Preference>(payload),
    };
    if (method === "PATCH")
      writeLocal(PREFERENCES_KEY, { ...next, updatedAt: new Date().toISOString() });
    return { data: next as T };
  }
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
    const { data, meta: pageMeta } = await request<T[]>("GET", path);
    const items = Array.isArray(data) ? data : [];
    return { items, meta: pageMeta ?? meta(1, items.length, items.length) };
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

  /// อัปโหลดไฟล์ · SVG แปลงเป็น PNG ก่อน (ไม่เก็บ SVG เพราะอาจมีสคริปต์)
  async upload<T>(path: string, file: File, fields?: Record<string, string>): Promise<T> {
    if (path !== "/assets") throw notAvailable();
    const body = isSvgFile(file) ? await rasterizeSvgFile(file) : file;
    return (await uploadAsset(body, fields ?? {})) as T;
  },

  async del<T>(path: string): Promise<T> {
    return (await request<T>("DELETE", path)).data;
  },
};
