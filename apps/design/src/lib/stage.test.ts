import { describe, expect, it } from "vitest";
import { pick, range, toggle, type Entry } from "@/registry/meta";
import { aiPrompt, installCommand, parseStage, readStage, stageKey, stageText } from "./stage";

const e = {
  slug: "dock",
  name: "Magnify Dock",
  summary: "แถบไอคอน",
  category: "navigation",
  blend: ["macOS dock"],
  added: "2026-11-01",
  controls: [
    range("magnify", "ขยาย", 1, 3, 0.1, 1.6),
    pick("size", "ขนาด", ["sm", "lg"], "sm"),
    toggle("labels", "ป้าย", true),
  ],
} as Entry;

describe("readStage", () => {
  it("keeps known keys inside their controls and fills the rest with defaults", () => {
    expect(
      readStage(
        { type: "croc:stage", surface: "dots", values: { magnify: 99, size: "xl", evil: "x" } },
        e,
      ),
    ).toEqual({ surface: "dots", values: { magnify: 3, size: "sm", labels: true } });
  });

  it("rejects anything that is not a stage message", () => {
    expect(readStage(null, e)).toBeNull();
    expect(readStage("croc:stage", e)).toBeNull();
    expect(readStage({ type: "croc:stage", surface: "neon", values: {} }, e)).toBeNull();
    expect(readStage({ type: "other", surface: "grid", values: {} }, e)).toBeNull();
  });
});

describe("stageText / parseStage", () => {
  it("round-trips what the playground set, clamped, and ignores junk", () => {
    const set = { surface: "grid" as const, values: { magnify: 2, size: "lg", labels: false } };
    expect(parseStage(stageText(set), e)).toEqual(set);
    expect(
      parseStage('{"type":"croc:stage","surface":"grid","values":{"magnify":50}}', e)?.values,
    ).toEqual({ magnify: 3, size: "sm", labels: true });
    expect(parseStage("{not json", e)).toBeNull();
    expect(parseStage(null, e)).toBeNull();
    expect(stageKey("dock")).toBe("croc-stage:dock");
  });
});

describe("install and prompt", () => {
  const base = "https://r.example";
  it("builds one line per package manager", () => {
    expect(installCommand("pnpm", base, "dock")).toBe(
      "pnpm dlx shadcn@latest add https://r.example/r/dock.json",
    );
    expect(installCommand("bun", base, "dock")).toBe(
      "bunx --bun shadcn@latest add https://r.example/r/dock.json",
    );
    expect(installCommand("croc-ui", base, "dock")).toMatch(/croc-ui\.mjs add dock$/);
  });

  it("puts registry, install, props and usage in the AI prompt", () => {
    const p = aiPrompt(e, {
      base,
      dependencies: ["motion@^14.14.0"],
      usage: "<Dock />",
      brief: "Build it",
    });
    expect(p).toContain("<registry>https://r.example/r/dock.json</registry>");
    expect(p).toContain("<dependencies>motion@^14.14.0</dependencies>");
    expect(p).toContain('- size: "sm" | "lg", default "sm"');
    expect(p).toContain("- magnify: number 1-3, default 1.6");
    expect(p).toContain("<usage>\n<Dock />\n</usage>");
  });
});
