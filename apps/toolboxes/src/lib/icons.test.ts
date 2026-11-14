import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matches } from "@/pages/icon-library";

// plain .mjs build script, typed here
const { OK, UNSAFE } = (await import("../../tools/icons.mjs" as string)) as {
  OK: RegExp;
  UNSAFE: RegExp;
};

// Guards the icon library (tools/icons.mjs): only icons we may redistribute, nothing that runs
// code or loads from elsewhere, and the trademark / licence notice ships with them.
const dir = join(import.meta.dirname, "../../public/icons");
type Row = [string, string, string, string, string, string, string];
const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as Row[];

describe("icon library", () => {
  it("has a file for every entry and nothing else", () => {
    const svgs = readdirSync(dir).filter((f) => f.endsWith(".svg"));
    expect(svgs.sort()).toEqual(index.map((r) => `${r[0]}.svg`).sort());
    expect(index.length).toBeGreaterThan(5000);
  });

  it("keeps only redistributable licences and ships the notice", () => {
    for (const r of index) expect(r[3], r[0]).toMatch(OK);
    const notice = readFileSync(join(dir, "NOTICE.txt"), "utf8");
    expect(notice).toContain("trademarks of their owners");
    expect(notice).toContain("Permission is hereby granted");
  });

  it("has no SVG that can run code or load from elsewhere", () => {
    for (const bad of [
      "<svg><script>x</script></svg>",
      '<svg onload="x">',
      '<image href="https://e.com/a.png"/>',
      "<style>@import 'x.css'</style>",
      "<style>a{fill:url(https://e.com)}</style>",
    ])
      expect(bad).toMatch(UNSAFE);
    expect('<use href="#a"/><path fill="url(#b)"/>').not.toMatch(UNSAFE);
    for (const r of index)
      expect(readFileSync(join(dir, `${r[0]}.svg`), "utf8"), r[0]).not.toMatch(UNSAFE);
  }, 60_000); // reads every icon file: slow when the whole suite runs in parallel

  it("finds icons by name, slug or alias", () => {
    const gh: Row = ["github", "GitHub", "181717", "CC0-1.0", "brands", "DevTool", "gh"];
    expect(matches(gh, "git")).toBe(true);
    expect(matches(gh, " GH ")).toBe(true);
    expect(matches(gh, "gitlab")).toBe(false);
    expect(matches(gh, "")).toBe(true);
  });
});
