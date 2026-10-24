"use server";

import { safeNext } from "@/lib/apps";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Why the code exists: "signup" = confirm a new address, "login" = passwordless sign-in.
 * It decides which Supabase OTP type the code is checked against.
 */
export type CodePurpose = "signup" | "login";

/** `email` comes back so the form can refill it — React resets form fields after every action. */
export type AuthState = {
  error?: string;
  notice?: string;
  email?: string;
  /** set when the next screen is "type the 6-digit code we emailed you" */
  verify?: CodePurpose;
};

export type VerifyState = { error?: string; notice?: string; sentAt?: number };

const email = z.email().max(254);

const authInput = z.object({
  intent: z.enum(["signin", "signup"]),
  email,
  // bcrypt (Supabase Auth) ignores bytes past 72
  password: z.string().min(8).max(72),
});

const verifyInput = z.object({
  email,
  purpose: z.enum(["signup", "login"]),
  // exactly six digits — anything else never reaches Supabase
  token: z.string().regex(/^\d{6}$/),
});

const resendInput = verifyInput.omit({ token: true });

const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export async function authenticate(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const typed = field(formData, "email");
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();

  if (formData.get("intent") === "code") {
    const parsed = email.safeParse(typed);
    if (!parsed.success) return { email: typed, error: "กรอกอีเมลให้ถูกต้อง" };
    // shouldCreateUser: false — a code login never creates accounts. Same answer whether or not
    // the address has an account, so the form can't be used to probe who is registered.
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: false },
    });
    if (error?.status === 429)
      return { email: typed, error: "ขอรหัสถี่เกินไป รอสักครู่แล้วลองใหม่" };
    return { email: parsed.data, verify: "login" };
  }

  const input = authInput.safeParse({
    intent: formData.get("intent"),
    email: typed,
    password: formData.get("password"),
  });
  if (!input.success)
    return { email: typed, error: "กรอกอีเมลให้ถูกต้อง และรหัสผ่าน 8–72 ตัวอักษร" };
  const { intent, ...credentials } = input.data;

  if (intent === "signin") {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    // one message for every failure — don't reveal which emails have accounts
    if (error) return { email: typed, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    redirect(next);
  }

  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: { emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { email: typed, error: "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" };
  // email confirmation on: no session until the emailed code (or link) is used
  if (!data.session) return { email: credentials.email, verify: "signup" };
  redirect(next);
}

export async function verifyCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const input = verifyInput.safeParse({
    email: field(formData, "email"),
    purpose: formData.get("purpose"),
    token: field(formData, "token"),
  });
  if (!input.success) return { error: "กรอกรหัส 6 หลักให้ครบ" };

  const { email: address, purpose, token } = input.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: address,
    token,
    type: purpose === "signup" ? "signup" : "email",
  });
  if (error?.status === 429) return { error: "ลองผิดหลายครั้งเกินไป รอสักครู่แล้วขอรหัสใหม่" };
  // wrong, expired and already-used codes look the same from outside
  if (error) return { error: "รหัสไม่ถูกต้องหรือหมดอายุแล้ว" };
  redirect(safeNext(formData.get("next")));
}

export async function resendCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const input = resendInput.safeParse({
    email: field(formData, "email"),
    purpose: formData.get("purpose"),
  });
  if (!input.success) return { error: "ขอรหัสใหม่ไม่สำเร็จ" };

  const { email: address, purpose } = input.data;
  const supabase = await createClient();
  const { error } =
    purpose === "signup"
      ? await supabase.auth.resend({ type: "signup", email: address })
      : await supabase.auth.signInWithOtp({
          email: address,
          options: { shouldCreateUser: false },
        });
  // Supabase enforces the real resend cooldown; the button timer only mirrors it
  if (error?.status === 429) return { error: "ขอรหัสถี่เกินไป รอสักครู่แล้วลองใหม่" };
  return { notice: "ส่งรหัสใหม่แล้ว รหัสเดิมใช้ไม่ได้แล้ว", sentAt: Date.now() };
}
