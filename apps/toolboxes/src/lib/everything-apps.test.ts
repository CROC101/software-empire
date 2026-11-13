import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import apps from "./everything-apps.json";

// Guards the built Everything apps (tools/everything.mjs): each keeps its licence and names its
// source (AGPL section 13), and none loads Puter's SDK or third-party analytics.
const root = join(import.meta.dirname, "../../public/everything");
const read = (slug: string, file: string) => readFileSync(join(root, slug, file), "utf8");

describe("everything apps", () => {
  it.each(apps.map((a) => a.slug))("%s keeps licence, source and no outside scripts", (slug) => {
    expect(existsSync(join(root, slug, "LICENSE"))).toBe(true);
    expect(read(slug, "SOURCE.md")).toContain("https://github.com/CROC101/everything/tree/");
    const html = read(slug, "index.html");
    expect(html).toMatch(/<script src="\.\.\/puter-shim\.js\?v=\w+"><\/script>/);
    expect(html).toContain("../crocwork.css");
    // a quoted URL is a load (src=, s.src =); upstream comments may still name the hosts
    expect(html).not.toMatch(/["']https:\/\/(js\.puter\.com|plausible\.io)/);
  });

  it.each(apps.map((a) => a.slug))("%s asks for its own files under its folder", (slug) => {
    const assets = join(root, slug, "assets");
    if (!existsSync(assets)) return;
    for (const f of readdirSync(assets).filter((f) => f.endsWith(".js"))) {
      // "/app-icon.png" would load from the site root, not /everything/<slug>/
      for (const [, , file = ""] of read(slug, `assets/${f}`).matchAll(
        /(["'`])\/([\w.-]+\.\w+)\1/g,
      ))
        expect(existsSync(join(root, slug, file)), `${f}: "/${file}"`).toBe(false);
    }
  });

  it.each(apps.map((a) => a.slug))("%s pages stay on this site", (slug) => {
    // docs sites (cap-table, inventory) have their own pages beside index.html
    const dir = join(root, slug);
    for (const f of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
      if (!f.endsWith(".html")) continue;
      const html = read(slug, f);
      expect(html, f).not.toMatch(/["']https:\/\/plausible\.io/);
      for (const [, path = ""] of html.matchAll(
        /(?:href|src|content)="\/(?!\/|everything\/)([^"#?]*)"/g,
      ))
        expect(existsSync(join(dir, path)), `${f}: "/${path}"`).toBe(false);
    }
  });

  it.each(apps.map((a) => a.slug))("%s speaks as crocwork, not Puter", (slug) => {
    // the credit lives in LICENSE and SOURCE.md; what users read is ours (tools/everything.mjs brand)
    const dir = join(root, slug);
    for (const f of readdirSync(dir, { recursive: true, encoding: "utf8" })) {
      if (!/\.(html|js|json|webmanifest)$/.test(f)) continue;
      const text = read(slug, f);
      expect(text, f).not.toMatch(/\bPuter\b/);
      // shortcut: puter.com/privacy, /terms and the developer docs stay until crocwork has its own
      expect(text, f).not.toMatch(
        /https:\/\/(www\.|apps\.|builder\.)?puter\.com\/?["'`]|(captable|inventory)\.puter\.com/,
      );
    }
  });

  it("lists every AGPL app with its licence text", () => {
    const agpl = apps.filter((a) => read(a.slug, "SOURCE.md").includes("AGPL"));
    expect(agpl).toHaveLength(15);
    for (const a of agpl) expect(read(a.slug, "LICENSE")).toMatch(/AFFERO/);
  });
});
