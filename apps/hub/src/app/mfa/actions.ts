"use server";

import { safeNext } from "@/lib/apps";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MfaSetup =
  | { mode: "verify"; factorId: string }
  | { mode: "enroll"; factorId: string; qr: string; secret: string }
  | { mode: "error" };

export type MfaState = { error?: string };

/** The admin's TOTP factor, or a fresh one to scan. Unfinished enrolments are thrown away. */
export async function startMfa(): Promise<MfaSetup> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { mode: "error" };
  // data.totp lists verified factors only
  const ready = data.totp[0];
  if (ready) return { mode: "verify", factorId: ready.id };

  for (const factor of data.all.filter(
    (f) => f.factor_type === "totp" && f.status !== "verified",
  )) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const enrolled = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "crocwork admin",
  });
  if (enrolled.error) return { mode: "error" };
  return {
    mode: "enroll",
    factorId: enrolled.data.id,
    qr: enrolled.data.totp.qr_code,
    secret: enrolled.data.totp.secret,
  };
}

const confirmInput = z.object({
  factorId: z.uuid(),
  // exactly six digits — anything else never reaches Supabase
  code: z.string().regex(/^\d{6}$/),
});

/** Checks the app's 6-digit code; on success the session becomes aal2 and the admin goes on. */
export async function confirmMfa(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const code = formData.get("code");
  const input = confirmInput.safeParse({
    factorId: formData.get("factorId"),
    code: typeof code === "string" ? code.trim() : "",
  });
  if (!input.success) return { error: "กรอกรหัส 6 หลักจากแอป" };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify(input.data);
  if (error?.status === 429) return { error: "ลองผิดหลายครั้งเกินไป รอสักครู่" };
  if (error) return { error: "รหัสไม่ถูกต้องหรือหมดเวลาแล้ว ลองรหัสใหม่จากแอป" };
  redirect(safeNext(formData.get("next")));
}
