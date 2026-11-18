import { describe, expect, it } from "vitest";
import { clock, timeAgo } from "./time";

describe("timeAgo", () => {
  const now = Date.parse("2026-11-18T12:00:00Z");

  it("picks the largest whole unit", () => {
    expect(timeAgo("2026-11-18T11:59:30Z", now)).toBe("เมื่อสักครู่");
    expect(timeAgo("2026-11-18T09:00:00Z", now)).toContain("3");
    expect(timeAgo("2026-11-18T09:00:00Z", now)).toContain("ชั่วโมง");
    expect(timeAgo("2025-11-01T00:00:00Z", now)).toContain("ปี");
  });

  it("is empty for dates it cannot read and never says the future", () => {
    expect(timeAgo("not a date", now)).toBe("");
    expect(timeAgo("2027-01-01T00:00:00Z", now)).toBe("เมื่อสักครู่");
  });
});

describe("clock", () => {
  it("formats like a video player", () => {
    expect(clock(754)).toBe("12:34");
    expect(clock(3725)).toBe("1:02:05");
    expect(clock(5)).toBe("0:05");
  });
});
