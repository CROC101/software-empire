import { describe, expect, it } from "vitest";
import { jumpTo, ratioAt } from "./theater";

describe("ratioAt", () => {
  it("clamps the pointer to the bar", () => {
    expect(ratioAt(50, 200)).toBe(0.25);
    expect(ratioAt(-10, 200)).toBe(0);
    expect(ratioAt(300, 200)).toBe(1);
    expect(ratioAt(10, 0)).toBe(0);
  });
});

describe("jumpTo", () => {
  it("maps 0-9 to tenths of the video and ignores other keys", () => {
    expect(jumpTo("0", 600)).toBe(0);
    expect(jumpTo("5", 600)).toBe(300);
    expect(jumpTo("9", 600)).toBe(540);
    expect(jumpTo("k", 600)).toBeNull();
    expect(jumpTo("5", 0)).toBeNull();
  });
});
