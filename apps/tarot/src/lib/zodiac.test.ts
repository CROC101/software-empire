import { describe, expect, it } from "vitest";
import { harmony, signOf, SIGNS } from "./zodiac";

describe("signOf (Thai reckoning)", () => {
  it("puts each sign's first day in that sign and the day before in the previous one", () => {
    expect(signOf("1995-04-14").id).toBe("aries");
    expect(signOf("1995-04-13").id).toBe("pisces");
    expect(signOf("2001-08-17").id).toBe("leo");
    expect(signOf("2001-08-16").id).toBe("cancer");
  });

  it("wraps the year: early January is still Sagittarius", () => {
    expect(signOf("2000-01-05").id).toBe("sagittarius");
    expect(signOf("2000-01-14").id).toBe("capricorn");
    expect(signOf("2000-12-31").id).toBe("sagittarius");
  });

  it("has twelve signs, three of each element", () => {
    expect(SIGNS).toHaveLength(12);
    for (const e of ["fire", "water", "air", "earth"] as const)
      expect(SIGNS.filter((s) => s.element === e)).toHaveLength(3);
  });
});

describe("harmony", () => {
  it("fire and air help each other, water and earth too; across them they pull", () => {
    expect(harmony("fire", "fire")).toBe("same");
    expect(harmony("fire", "air")).toBe("help");
    expect(harmony("earth", "water")).toBe("help");
    expect(harmony("fire", "water")).toBe("pull");
  });
});
