import { describe, expect, it } from "vitest";
import { captchaToken, passedRules, signUpInput } from "./auth";

const valid = { name: "จระเข้", email: "a@b.co", password: "river2026", confirm: "river2026" };
const firstError = (input: object) => signUpInput.safeParse(input).error?.issues[0]?.message;

describe("sign-up input", () => {
  it("accepts a complete form and trims the name", () => {
    expect(signUpInput.parse({ ...valid, name: "  จระเข้  " }).name).toBe("จระเข้");
  });

  it("asks for letters and digits, at least 8", () => {
    expect(passedRules("abc")).toBe(1);
    expect(passedRules("ภาษาไทย1")).toBe(3);
    for (const password of ["short1", "onlyletters", "12345678"])
      expect(firstError({ ...valid, password, confirm: password })).toMatch(/รหัสผ่าน/);
  });

  it("refuses a mismatched confirmation", () => {
    expect(firstError({ ...valid, confirm: "river2027" })).toBe("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
  });

  it("refuses empty, long and invisible-character names", () => {
    expect(firstError({ ...valid, name: "   " })).toBe("กรอกชื่อที่จะแสดง");
    expect(firstError({ ...valid, name: "ก".repeat(41) })).toMatch(/40/);
    expect(firstError({ ...valid, name: "ad​min" })).toBe("ชื่อมีอักขระที่ใช้ไม่ได้");
  });
});

describe("captcha token", () => {
  it("passes a Turnstile token through", () => {
    expect(captchaToken("0.abc-DEF_123")).toBe("0.abc-DEF_123");
  });

  it("drops missing, empty, non-string and oversized values", () => {
    expect(captchaToken(null)).toBeUndefined();
    expect(captchaToken("")).toBeUndefined();
    expect(captchaToken(new Blob(["x"]))).toBeUndefined();
    expect(captchaToken("x".repeat(2049))).toBeUndefined();
  });
});
