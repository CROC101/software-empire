/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readChoice, resolve, THEME_BOOT_SCRIPT, themeCookie } from "./theme";

const apps = join(import.meta.dirname, "../../../apps");

describe("shared theme cookie", () => {
  it("reads the choice among other cookies and falls back to light", () => {
    expect(readChoice("a=1; em-theme=dark; b=2")).toBe("dark");
    expect(readChoice("em-theme=system")).toBe("system");
    expect(readChoice("xem-theme=dark")).toBe("light");
    expect(readChoice("em-theme=<script>")).toBe("light");
    expect(readChoice("")).toBe("light");
  });

  it("scopes the cookie to the parent domain only when one is configured", () => {
    expect(themeCookie("dark")).not.toContain("Domain");
    expect(themeCookie("dark", ".crocwork.studio")).toContain("Domain=.crocwork.studio");
    expect(themeCookie("dark")).toMatch(/^em-theme=dark; Path=\/; Max-Age=\d+; SameSite=Lax/);
  });

  it("resolves system from the OS setting", () => {
    expect(resolve("system", true)).toBe("dark");
    expect(resolve("system", false)).toBe("light");
    expect(resolve("light", true)).toBe("light");
  });

  // every app — today 5, later 100+ — must run the same pre-paint script, or themes drift
  it("every app ships the identical theme-boot.js", () => {
    const missing: string[] = [];
    for (const app of readdirSync(apps)) {
      if (!existsSync(join(apps, app, "package.json"))) continue; // tool caches, not apps
      const file = join(apps, app, "public/theme-boot.js");
      if (process.env.WRITE_THEME_BOOT) writeFileSync(file, THEME_BOOT_SCRIPT);
      if (!existsSync(file) || readFileSync(file, "utf8") !== THEME_BOOT_SCRIPT) missing.push(app);
    }
    // fix: WRITE_THEME_BOOT=1 pnpm --filter @empire/core test
    expect(missing).toEqual([]);
  });
});

describe("shared ambience", () => {
  it("reads only known values, defaulting to auto", async () => {
    const { readAmbience } = await import("./theme");
    expect(readAmbience("em-ambience=rain")).toBe("rain");
    expect(readAmbience("em-theme=dark; em-ambience=snow")).toBe("snow");
    expect(readAmbience("em-ambience=<x>")).toBe("auto");
    expect(readAmbience("")).toBe("auto");
  });

  it("follows the Thai seasons by day and goes to space at night", async () => {
    const { seasonFor } = await import("./theme");
    expect(seasonFor(3, false)).toBe("bloom"); // April
    expect(seasonFor(9, false)).toBe("rain"); // October
    expect(seasonFor(11, false)).toBe("snow"); // December
    expect(seasonFor(3, true)).toBe("space");
  });

  it("knows the festivals, Thai and international, by date", async () => {
    const { festivalFor, readAmbience } = await import("./theme");
    expect(festivalFor(9, 29)).toBe("halloween");
    expect(festivalFor(9, 14)).toBe(null);
    expect(festivalFor(10, 24)).toBe("loykrathong");
    expect(festivalFor(11, 24)).toBe("christmas");
    expect(festivalFor(11, 31)).toBe("newyear");
    expect(festivalFor(0, 2)).toBe("newyear");
    expect(festivalFor(3, 13)).toBe("songkran");
    expect(festivalFor(6, 1)).toBe(null);
    expect(readAmbience("em-ambience=halloween")).toBe("halloween");
  });
});
