"use server";

import { safeNext } from "@/lib/apps";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** `email` comes back so the form can refill it — React resets form fields after every action. */
export type AuthState = { error?: string; notice?: string; email?: string };

const authInput = z.object({
  intent: z.enum(["signin", "signup"]),
  email: z.email(),
  // bcrypt (Supabase Auth) ignores bytes past 72
  password: z.string().min(8).max(72),
});

export async function authenticate(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const typedEmail = formData.get("email");
  const email = typeof typedEmail === "string" ? typedEmail : "";
  const input = authInput.safeParse({
    intent: formData.get("intent"),
    email,
    password: formData.get("password"),
  });
  if (!input.success) return { email, error: "กรอกอีเมลให้ถูกต้อง และรหัสผ่าน 8–72 ตัวอักษร" };

  const { intent, ...credentials } = input.data;
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  if (intent === "signin") {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    // one message for every failure — don't reveal which emails have accounts
    if (error) return { email, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    redirect(next);
  }

  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { email, error: "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" };
  // email confirmation on: no session until the link in the email is opened
  if (!data.session)
    return { email, notice: "ส่งลิงก์ยืนยันไปที่อีเมลแล้ว เปิดลิงก์เพื่อเข้าสู่ระบบ" };
  redirect(next);
}
