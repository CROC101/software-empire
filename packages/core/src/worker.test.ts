import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validated } from "./worker";

describe("validated", () => {
  const double = validated(z.number().int(), (n) => n * 2);

  it("passes parsed input to the handler", () => {
    expect(double(21)).toBe(42);
  });

  it("throws before the handler runs on bad input", () => {
    expect(() => double("21")).toThrow();
  });
});
