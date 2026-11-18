import { describe, expect, it } from "vitest";
import { stepRate } from "./player";

describe("stepRate", () => {
  it("moves one YouTube speed at a time and stops at the ends", () => {
    expect(stepRate(1, 1)).toBe(1.25);
    expect(stepRate(1, -1)).toBe(0.75);
    expect(stepRate(2, 1)).toBe(2);
    expect(stepRate(0.25, -1)).toBe(0.25);
    expect(stepRate(3, 1)).toBe(1.25);
  });
});
