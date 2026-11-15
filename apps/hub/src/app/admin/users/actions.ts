"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type UserActionState = { ok: boolean; message: string } | null;

const change = z.object({
  target: z.uuid(),
  kind: z.enum(["ban", "unban", "make_admin", "remove_admin"]),
});

const DONE = {
  ban: "ระงับบัญชีแล้ว",
  unban: "ปลดระงับแล้ว",
  make_admin: "ตั้งเป็นแอดมินแล้ว",
  remove_admin: "ถอดสิทธิ์แอดมินแล้ว",
} as const;

/**
 * A server action is a public POST endpoint: the SQL functions check cms.is_admin() themselves
 * (with this person's JWT), refuse changes to your own account, and write the audit log.
 */
export async function changeUser(_: UserActionState, form: FormData): Promise<UserActionState> {
  const parsed = change.safeParse({ target: form.get("target"), kind: form.get("kind") });
  if (!parsed.success) return { ok: false, message: "คำขอไม่ถูกต้อง" };
  const { target, kind } = parsed.data;
  const hub = (await createClient()).schema("hub");
  const { error } =
    kind === "ban" || kind === "unban"
      ? await hub.rpc("admin_set_banned", { target, banned: kind === "ban" })
      : await hub.rpc("admin_set_admin", { target, make: kind === "make_admin" });
  if (error) {
    const self = error.message.includes("yourself") || error.message.includes("your own");
    return { ok: false, message: self ? "ทำกับบัญชีตัวเองไม่ได้" : "ทำไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  revalidatePath("/admin/users");
  return { ok: true, message: DONE[kind] };
}
