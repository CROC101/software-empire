import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, SOURCE_URL } from "@/components/pages/apps-view";
import apps from "./apps.json";

// Guards the built crocwork apps (tools/apps.mjs): they are crocwork's, keep the MIT notice of
// the code they started from, and load nothing from outside the site. The AGPL apps keep their
// licence and a link to their source.
const root = join(import.meta.dirname, "../../public/apps");
const read = (slug: string, file: string) => readFileSync(join(root, slug, file), "utf8");
const slugs = apps.map((a) => a.slug);
const isAgpl = (slug: string) => apps.some((a) => a.slug === slug && "licence" in a);

describe("crocwork apps", () => {
  it("are crocwork's, with the MIT notice kept in one file", () => {
    expect(readFileSync(join(root, "LICENSE"), "utf8")).toMatch(/Copyright \(c\) \d{4} crocwork/);
    const notices = readFileSync(join(root, "THIRD_PARTY_NOTICES.txt"), "utf8");
    expect(notices).toContain("MIT License");
    expect(notices).toContain("Permission is hereby granted");
    expect(notices).toContain("GNU Affero General Public License v3.0 only");
  });

  it("links the AGPL apps' source at the commit the build script uses", () => {
    const script = readFileSync(join(import.meta.dirname, "../../tools/apps.mjs"), "utf8");
    const repo = /const REPO = "([^"]+)"/.exec(script)?.[1];
    const commit = /const COMMIT = "([^"]+)"/.exec(script)?.[1];
    expect(SOURCE_URL).toBe(`${repo}/tree/${commit}/src`);
    for (const slug of slugs)
      if (isAgpl(slug))
        expect(read(slug, "LICENSE"), slug).toContain("GNU AFFERO GENERAL PUBLIC LICENSE");
      else expect(existsSync(join(root, slug, "LICENSE")), slug).toBe(false);
  });

  it("built every app in the manifest and nothing else", () => {
    const built = readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "fonts")
      .map((d) => d.name);
    expect(built.sort()).toEqual([...slugs].sort());
  });

  it("names each app in Thai and English under a known category", () => {
    const keys = CATEGORIES.map((c) => c.key);
    for (const a of apps) {
      expect(keys, a.slug).toContain(a.category);
      for (const text of [a.name.th, a.name.en, a.description.th, a.description.en])
        expect(text.trim(), a.slug).not.toBe("");
    }
  });

  it.each(slugs)("%s loads the crocwork SDK and theme, nothing from outside", (slug) => {
    const html = read(slug, "index.html");
    expect(html).toMatch(/<script src="\.\.\/crocwork-sdk\.js\?v=\w+"><\/script>/);
    expect(html).toContain("../crocwork.css");
    // a quoted URL is a load (src=, s.src =); upstream comments may still name the hosts
    expect(html).not.toMatch(/["']https:\/\/(js\.puter\.com|plausible\.io)/);
  });

  it.each(slugs)("%s asks for its own files under its folder", (slug) => {
    const assets = join(root, slug, "assets");
    if (!existsSync(assets)) return;
    for (const f of readdirSync(assets).filter((f) => f.endsWith(".js"))) {
      // "/app-icon.png" would load from the site root, not /apps/<slug>/
      for (const [, , file = ""] of read(slug, `assets/${f}`).matchAll(
        /(["'`])\/([\w.-]+\.\w+)\1/g,
      ))
        expect(existsSync(join(root, slug, file)), `${f}: "/${file}"`).toBe(false);
    }
  });

  it.each(slugs)("%s pages stay on this site", (slug) => {
    // docs sites (cap-table, inventory) have their own pages beside index.html
    const dir = join(root, slug);
    for (const f of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
      if (!f.endsWith(".html")) continue;
      const html = read(slug, f);
      expect(html, f).not.toMatch(/["']https:\/\/plausible\.io/);
      for (const [, path = ""] of html.matchAll(/(?:href|src|content)="\/(?!\/|apps\/)([^"#?]*)"/g))
        expect(existsSync(join(dir, path)), `${f}: "/${path}"`).toBe(false);
    }
  });

  it.each(slugs)("%s speaks as crocwork, with no upstream repo", (slug) => {
    const dir = join(root, slug);
    for (const f of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
      if (/^(SOURCE\.md|icon-128\.png)$/.test(f)) throw new Error(`${slug}/${f} is back`);
      if (!/\.(html|js|json|webmanifest)$/.test(f)) continue;
      const text = read(slug, f);
      expect(text, f).not.toMatch(/\bPuter\b/);
      expect(text, f).not.toMatch(/github\.com\/heyputer/i);
      // only an AGPL app may carry AGPL code
      if (!isAgpl(slug)) expect(text, f).not.toMatch(/GNU Affero/i);
      // shortcut: puter.com/privacy, /terms and the developer docs stay until crocwork has its own
      expect(text, f).not.toMatch(
        /https:\/\/(www\.|apps\.|builder\.)?puter\.com\/?["'`]|(captable|inventory)\.puter\.com/,
      );
    }
  });
});
