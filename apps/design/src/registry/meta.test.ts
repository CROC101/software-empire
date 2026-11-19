import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { categories, clampValue, defaults, kindOf, promptFor, registry } from "./meta";

const dir = path.join(import.meta.dirname);
const partsSource = readFileSync(path.join(dir, "parts.tsx"), "utf8");

describe("registry", () => {
  it("has unique ASCII slugs, each with its own file and a slot in parts.tsx", () => {
    const slugs = registry.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(existsSync(path.join(dir, "ui", `${slug}.tsx`))).toBe(true);
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

  it("has a valid date, a unique rank and a prompt for every part", () => {
    const ranks = registry.flatMap((e) => (e.rank === undefined ? [] : [e.rank]));
    expect(new Set(ranks).size).toBe(ranks.length);
    for (const e of registry) {
      expect(e.added).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(e.added))).toBe(false);
      expect(promptFor(e).length).toBeGreaterThan(80);
    }
  });

  it("credits every 21st.dev remake with its author's public page", () => {
    const credited = registry.filter((e) => e.credit);
    expect(credited.length).toBeGreaterThanOrEqual(16);
    for (const e of credited) {
      expect(e.credit?.url).toMatch(/^https:\/\/21st\.dev\/@[\w-]+\/components\/[\w-]+$/);
      expect(e.credit?.url.startsWith(`https://21st.dev/${e.credit.author}/`)).toBe(true);
      expect(e.prompt?.length).toBeGreaterThan(80);
    }
  });

  it("covers 100+ components, every category and kind, and no stray part files", () => {
    expect(registry.filter((e) => kindOf(e) === "component").length).toBeGreaterThanOrEqual(100);
    const used = new Set(registry.map((e) => e.category));
    for (const c of Object.keys(categories)) expect(used).toContain(c);
    const slots = [...partsSource.matchAll(/^\s+"?([a-z0-9-]+)"?: lazy\(/gm)].map((m) => m[1]);
    expect(slots.sort()).toEqual(registry.map((e) => e.slug).sort());
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
