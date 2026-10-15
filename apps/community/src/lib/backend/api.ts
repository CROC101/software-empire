/// ตัวเรียกข้อมูลของ Empire Community — จุดเดียวที่หน้าบ้านคุยกับข้อมูล
///
/// csmju-nexus เรียก REST ของ NestJS ผ่าน `api.get('/profiles/…')` ทั่วทั้งแอป Empire ไม่มีหลังบ้านนั้น
/// ไฟล์นี้เก็บ API เดิมไว้ทุกตัว แล้วจับคู่ path ไปยังตารางเส้นทางของแต่ละกลุ่ม (social · chat · feed · reels · stories)
/// ที่ทำงานกับ schema `community` ของ Supabase — กติกาความเป็นส่วนตัวอยู่ใน RLS และฟังก์ชัน SQL
/// path ที่ยังไม่ย้ายตอบ 501 พร้อมข้อความภาษาไทย — ย้ายทีละรอบ (ดู CLAUDE.md)
import { meta, notAvailable, type PaginationMeta, type Page, type Route } from "./api-core";
import { CHAT_ROUTES } from "./chat-api";
import { ACTIVITY_ROUTES } from "./activity-api";
import { ADMIN_ROUTES } from "./admin-api";
import { FEED_ROUTES } from "./feed-api";
import { NOTIFY_ROUTES } from "./notify-api";
import { REEL_ROUTES } from "./reels-api";
import { SOCIAL_ROUTES } from "./social-api";
import { STORY_ROUTES } from "./stories-api";
import { VOICE_ROUTES } from "./voice-api";

export { ApiError, qs, setUnauthorizedHandler, type Page, type PaginationMeta } from "./api-core";

const ROUTES: Route[] = [
  ...SOCIAL_ROUTES,
  ...CHAT_ROUTES,
  ...FEED_ROUTES,
  ...REEL_ROUTES,
  ...STORY_ROUTES,
  ...NOTIFY_ROUTES,
  ...ACTIVITY_ROUTES,
  ...VOICE_ROUTES,
  ...ADMIN_ROUTES,
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
