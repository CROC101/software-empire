/**
 * Sign-in and sign-up input rules, shared by the hub's server actions (the trust boundary) and
 * its forms (live hints only). One source, so a hint can never promise what the server refuses.
 */
import { z } from "zod";

export const email = z.email().max(254);

/** Each rule the password must pass, in the order the form lists them. */
export const PASSWORD_RULES = [
  { id: "length", label: "8 ตัวขึ้นไป", test: (p: string) => p.length >= 8 },
  { id: "letter", label: "มีตัวอักษร", test: (p: string) => /\p{L}/u.test(p) },
  { id: "digit", label: "มีตัวเลข", test: (p: string) => /\d/.test(p) },
] as const;

export const passedRules = (password: string) =>
  PASSWORD_RULES.filter((rule) => rule.test(password)).length;

// bcrypt (Supabase Auth) ignores bytes past 72
const password = z.string().max(72);

export const signInInput = z.object({ email, password: password.min(8) });

export const signUpInput = z
  .object({
    // shown to other people, so no control characters or zero-width tricks
    name: z
      .string()
      .trim()
      .min(1, "กรอกชื่อที่จะแสดง")
      .max(40, "ชื่อยาวได้ไม่เกิน 40 ตัวอักษร")
      .refine((n) => !/[\p{Cc}\p{Cf}]/u.test(n), "ชื่อมีอักขระที่ใช้ไม่ได้"),
    email,
    password: password.refine(
      (p) => passedRules(p) === PASSWORD_RULES.length,
      "รหัสผ่านต้องยาว 8 ตัวขึ้นไป มีทั้งตัวอักษรและตัวเลข",
    ),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
  });

export type SignUpInput = z.infer<typeof signUpInput>;
