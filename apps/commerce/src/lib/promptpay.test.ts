import { describe, expect, it } from "vitest";
import { crc16, promptPayPayload } from "./promptpay";

describe("PromptPay QR payload", () => {
  it("uses CRC-16/CCITT-FALSE (standard check value)", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("encodes a mobile number as 0066 + number without the leading 0, and the exact amount", () => {
    const p = promptPayPayload("0812345678", 200000);
    expect(p).toContain("29370016A00000067701011101130066812345678");
    expect(p).toContain("54072000.00");
    expect(p).toContain("5303764");
    expect(p.slice(0, 12)).toBe("000201010212");
  });

  it("ends with a CRC over everything before it", () => {
    const p = promptPayPayload("0812345678", 4250);
    expect(p.slice(-8, -4)).toBe("6304");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });

  it("accepts a 15-digit e-wallet id and rejects anything else", () => {
    expect(promptPayPayload("123456789012345", 10000)).toContain("0315123456789012345");
    expect(() => promptPayPayload("1234567890123", 10000)).toThrow();
  });
});
