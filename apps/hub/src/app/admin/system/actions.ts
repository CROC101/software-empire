"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { SITE_TAG } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type SystemState = { ok: boolean; message: string } | null;

// <input type="datetime-local"> has no zone: the admin types Thai time
const thaiLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .transform((value) => new Date(`${value}:00+07:00`).toISOString());

const settings = z.object({
  launch_at: thaiLocal,
  soon_message: z.string().max(500),
  announcement: z.string().max(300),
  quick: z.enum(["", "now", "year"]),
});

const app = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,32}$/),
  status: z.enum(["open", "maintenance", "off"]),
  message: z.string().max(500),
  login: z.boolean(),
});

const FAILED = { ok: false, message: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" } as const;

/**
 * Server actions are public POST endpoints: hub.admin_set_* check cms.is_admin() with this
 * person's JWT and log the old and new values. The gate reads the database on every page, so a
 * change works at once; updateTag refreshes the cached copies on the countdown and banner.
 */
export async function saveSettings(_: SystemState, form: FormData): Promise<SystemState> {
  const parsed = settings.safeParse({
    launch_at: form.get("launch_at"),
    soon_message: form.get("soon_message") ?? "",
    announcement: form.get("announcement") ?? "",
    quick: form.get("quick") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const { quick, ...rest } = parsed.data;
  const launch_at =
    quick === "now"
      ? new Date().toISOString()
      : quick === "year"
        ? new Date(Date.now() + 365 * 86_400_000).toISOString()
        : rest.launch_at;
  const { error } = await (
    await createClient()
  )
    .schema("hub")
    .rpc("admin_set_settings", { ...rest, launch_at });
  if (error) return FAILED;
  updateTag(SITE_TAG);
  return {
    ok: true,
    message: quick === "now" ? "เปิดเว็บแล้ว ทุกคนเข้าได้ตอนนี้" : "บันทึกแล้ว",
  };
}

export async function saveApp(_: SystemState, form: FormData): Promise<SystemState> {
  const parsed = app.safeParse({
    slug: form.get("slug"),
    status: form.get("status"),
    message: form.get("message") ?? "",
    login: form.get("login") === "on",
  });
  if (!parsed.success) return { ok: false, message: "ข้อมูลไม่ถูกต้อง" };
  const { error } = await (await createClient()).schema("hub").rpc("admin_set_app", parsed.data);
  if (error) {
    const hub = error.message.includes("maintenance");
    return hub ? { ok: false, message: "ปิด hub ไม่ได้ ใช้โหมดปรับปรุงแทน" } : FAILED;
  }
  updateTag(SITE_TAG);
  return { ok: true, message: `บันทึก ${parsed.data.slug} แล้ว` };
}
