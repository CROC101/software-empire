import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import apps from "./apps.json";
import { CRAFT_APPS, downloads, releaseUrl } from "./craft-apps";

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
      expect(readFileSync(join(root, a.slug, "VERSION"), "utf8").trim(), a.slug).toBe(
        `${a.repo}@${a.tag}`,
      );
    }
  });

  it.each(built.map((a) => a.slug))(
    "%s keeps its licences and loads nothing from outside",
    (slug) => {
      // crocwork Video (OpenCut) is MIT only; the others are MIT OR Apache-2.0
      const licences = slug === "video" ? ["LICENSE-MIT"] : ["LICENSE-MIT", "LICENSE-APACHE"];
      for (const f of ["NOTICE", ...licences])
        expect(existsSync(join(root, slug, f)), f).toBe(true);
      const html = readFileSync(join(root, slug, "index.html"), "utf8");
      expect(html).not.toMatch(/(?:src|href)="(?:https?:)?\/\//);
      // relative URLs (or Next's basePath /craft/<slug>/), so the build works under /craft/<slug>/
      expect(html.replaceAll(`"/craft/${slug}/`, '"./')).not.toMatch(/(?:src|href)="\//);
    },
  );
});

describe("crocwork Craft apps", () => {
  it("pairs each Pro app with a quick everything app that exists", () => {
    const slugs = new Set(apps.map((a) => a.slug));
    for (const a of CRAFT_APPS) if (a.light) expect(slugs.has(a.light), a.slug).toBe(true);
  });

  it("links every released app's MSI and portable zip at its tag", () => {
    expect(downloads(CRAFT_APPS[0])).toEqual({
      msi: "https://github.com/CROC101/crocwork-photo/releases/download/v0.23.1-crocwork.4/photocraft-0.23.1-windows-x64.msi",
      zip: "https://github.com/CROC101/crocwork-photo/releases/download/v0.23.1-crocwork.4/photocraft-0.23.1-windows-x64-portable.zip",
    });
    for (const a of CRAFT_APPS.filter((a) => a.asset)) expect(downloads(a), a.slug).toBeDefined();
    expect(downloads({ ...CRAFT_APPS[0], tag: "latest" })).toBeUndefined();
    // web-only releases (crocwork Video) show no Windows button
    const video = CRAFT_APPS.find((a) => a.slug === "video");
    expect(video?.web).toBe("/craft/video/");
    expect(video && releaseUrl(video)).toBeUndefined();
    expect(releaseUrl(CRAFT_APPS[0])).toContain("/releases/tag/");
  });
});
