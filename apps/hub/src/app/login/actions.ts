"use server";

import { email, signInInput, signUpInput } from "@empire/core/auth";
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

/**
 * `email` and `name` come back so the form can refill them — React resets form fields after
 * every action. `field` names the input the error belongs to, for aria-invalid.
 */
export type AuthState = {
  error?: string;
  field?: "name" | "email" | "password" | "confirm";
  notice?: string;
  email?: string;
  name?: string;
  /** set when the next screen is "type the 6-digit code we emailed you" */
  verify?: CodePurpose;
};

export type VerifyState = { error?: string; notice?: string; sentAt?: number };

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

  if (formData.get("intent") === "signin") {
    const input = signInInput.safeParse({ email: typed, password: formData.get("password") });
    if (!input.success)
      return { email: typed, error: "กรอกอีเมลให้ถูกต้อง และรหัสผ่าน 8–72 ตัวอักษร" };
    const { error } = await supabase.auth.signInWithPassword(input.data);
    // one message for every failure — don't reveal which emails have accounts
    if (error) return { email: typed, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    redirect(next);
  }

  const name = field(formData, "name");
  const input = signUpInput.safeParse({
    name,
    email: typed,
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!input.success) {
    const issue = input.error.issues[0];
    const at = issue?.path[0];
    return {
      email: typed,
      name,
      error: at === "email" ? "กรอกอีเมลให้ถูกต้อง" : (issue?.message ?? "ข้อมูลไม่ครบ"),
      field:
        at === "name" || at === "email" || at === "password" || at === "confirm" ? at : undefined,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: {
      data: { display_name: input.data.name },
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error?.status === 429)
    return { email: typed, name, error: "ส่งอีเมลถี่เกินไป รอสักครู่แล้วลองใหม่" };
  if (error) return { email: typed, name, error: "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง" };
  // email confirmation on: no session until the emailed code (or link) is used
  if (!data.session) return { email: input.data.email, verify: "signup" };
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
