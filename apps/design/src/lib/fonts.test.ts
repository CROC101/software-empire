import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defaultStyle,
  faceCss,
  filterFonts,
  fontFamilies,
  fontUrl,
  styleLabel,
  topTags,
  type FontFamily,
  type FontStyle,
} from "./fonts";

const bold: FontStyle = { file: "SourceSansPro-Bold", files: ["ttf", "woff"] };
const regular: FontStyle = { file: "SourceSansPro-Regular", files: ["ttf"] };
const fam: FontFamily = {
  slug: "source-sans-pro",
  name: "Source Sans Pro",
  authors: ["Paul D. Hunt"],
  licence: ["OFL"],
  tags: ["sans"],
  styles: [bold, regular],
};

describe("font helpers", () => {
  it("labels a style without the family name", () => {
    expect(styleLabel(fam, bold)).toBe("Bold");
    expect(styleLabel(fam, { file: "SourceSansPro-SemiboldIt", files: ["ttf"] })).toBe(
      "Semibold It",
    );
    expect(styleLabel(fam, { file: "something_else", files: ["ttf"] })).toBe("something else");
  });

  it("opens a card on the regular weight", () => {
    expect(defaultStyle(fam).file).toBe("SourceSansPro-Regular");
  });

  it("copies a rule with absolute urls, only for formats that exist", () => {
    const css = faceCss(fam, regular, "https://x.test");
    expect(css).toContain(
      'url("https://x.test/fontlib/source-sans-pro/SourceSansPro-Regular.ttf")',
    );
    expect(css).not.toContain(".woff");
  });

  it("filters by text and tag", () => {
    expect(filterFonts([fam], "hunt", "all")).toHaveLength(1);
    expect(filterFonts([fam], "", "serif")).toHaveLength(0);
    expect(topTags([fam, fam], 3)).toEqual(["sans"]);
  });
});

describe("fonts.json", () => {
  const lock = JSON.parse(
    readFileSync(new URL("../../tools/fonts.lock.json", import.meta.url), "utf8"),
  ) as Record<string, { url: string; sha256: string; bytes: number }>;
  const safe = /^[A-Za-z0-9._-]+$/;

  it("has every family with a file name the deploy can fetch", () => {
    expect(fontFamilies.length).toBeGreaterThan(150);
    for (const f of fontFamilies) {
      expect(safe.test(f.slug), f.slug).toBe(true);
      expect(f.styles.length, f.slug).toBeGreaterThan(0);
      for (const s of f.styles) {
        expect(safe.test(s.file), s.file).toBe(true);
        for (const k of s.files) {
          const e = lock[`${f.slug}/${s.file}.${k}`];
          expect(e, fontUrl(f, s, k)).toBeDefined();
          expect(e?.url.startsWith("https://usemodify.com/")).toBe(true);
          // Cloudflare serves at most 25 MiB per file
          expect(e?.bytes ?? Infinity).toBeLessThan(25 * 2 ** 20);
        }
      }
    }
  });

  it("names a unique slug per family", () => {
    expect(new Set(fontFamilies.map((f) => f.slug)).size).toBe(fontFamilies.length);
  });
});
