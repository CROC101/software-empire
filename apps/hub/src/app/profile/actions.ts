"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok: boolean; message: string } | null;

const profile = z.object({
  display_name: z.string().trim().min(1, "ใส่ชื่อก่อน").max(60, "ชื่อยาวได้ไม่เกิน 60 ตัวอักษร"),
  bio: z.string().trim().max(280, "แนะนำตัวได้ไม่เกิน 280 ตัวอักษร"),
});

/** Saves the signed-in person's own row; RLS on hub.profiles refuses anyone else's. */
export async function saveProfile(_: ProfileState, form: FormData): Promise<ProfileState> {
  const parsed = profile.safeParse({
    display_name: form.get("display_name") ?? "",
    bio: form.get("bio") ?? "",
  });
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return { ok: false, message: "หมดเวลาเข้าสู่ระบบ ล็อกอินใหม่อีกครั้ง" };
  const { error } = await supabase
    .schema("hub")
    .from("profiles")
    .upsert(parsed.data, { onConflict: "user_id" });
  if (error) return { ok: false, message: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  revalidatePath("/", "layout");
  return { ok: true, message: "บันทึกแล้ว" };
}
