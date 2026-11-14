import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import apps from "./apps.json";
import { CRAFT_APPS } from "./craft-apps";

const root = join(import.meta.dirname, "../../public/craft");
// apps with a web build; AniCraft ships only the Windows installer
const built = CRAFT_APPS.filter((a) => a.repo && a.web);

// public/craft is not in git: deploy downloads it with tools/craft/web.mjs; run that locally to test it
describe.skipIf(!existsSync(root))("crocwork Craft web builds", () => {
  it("has the web build of exactly the apps with a release, at the release's tag", () => {
    expect(readdirSync(root).sort()).toEqual(built.map((a) => a.slug).sort());
    for (const a of built) {
      expect(a.web).toBe(`/craft/${a.slug}/`);
      // tools/craft/web.mjs writes it; rerun it after bumping the tag
      expect(readFileSync(join(root, a.slug, "VERSION"), "utf8").trim(), a.slug).toBe(`${a.repo}@${a.tag}`);
    }
  });

  it.each(built.map((a) => a.slug))("%s keeps its licences and loads nothing from outside", (slug) => {
    for (const f of ["NOTICE", "LICENSE-MIT", "LICENSE-APACHE"]) expect(existsSync(join(root, slug, f)), f).toBe(true);
    const html = readFileSync(join(root, slug, "index.html"), "utf8");
    expect(html).not.toMatch(/(?:src|href)="(?:https?:)?\/\//);
    // relative URLs only, so the build works under /craft/<slug>/
    expect(html).not.toMatch(/(?:src|href)="\//);
  });
});

describe("crocwork Craft apps", () => {
  it("pairs each Pro app with a quick everything app that exists", () => {
    const slugs = new Set(apps.map((a) => a.slug));
    for (const a of CRAFT_APPS) if (a.light) expect(slugs.has(a.light), a.slug).toBe(true);
  });
});
