import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { categories, clampValue, defaults, registry } from "./meta";

const dir = path.join(import.meta.dirname);
const partsSource = readFileSync(path.join(dir, "parts.tsx"), "utf8");

describe("registry", () => {
  it("has unique ASCII slugs, each with its own file and a slot in parts.tsx", () => {
    const slugs = registry.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(existsSync(path.join(dir, `${slug}.tsx`))).toBe(true);
      expect(partsSource).toMatch(new RegExp(`["']?${slug}["']?: `));
    }
  });

  it("keeps every default inside its control", () => {
    for (const e of registry) {
      expect(Object.keys(categories)).toContain(e.category);
      for (const c of e.controls) expect(clampValue(c, c.value)).toBe(c.value);
      expect(Object.keys(defaults(e))).toEqual(e.controls.map((c) => c.key));
    }
  });

  it("clamps out-of-range playground input", () => {
    const [text, duration, trigger] =
      registry.find((x) => x.slug === "decode-text")?.controls ?? [];
    if (!text || !duration || !trigger) throw new Error("decode-text controls moved");
    expect(clampValue(duration, 99999)).toBe(3000);
    expect(clampValue(duration, "nope")).toBe(1200);
    expect(clampValue(trigger, "<script>")).toBe("loop");
    expect(clampValue(text, "x".repeat(100))).toHaveLength(32);
  });
});
