import { describe, expect, it } from "vitest";
import { passedRules, signUpInput } from "./auth";

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
