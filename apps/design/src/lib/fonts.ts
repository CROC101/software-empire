/**
 * The open font library on /fonts. fonts.json comes from `node tools/fonts.mjs --scan` (usemodify.com);
 * the files themselves are fetched at deploy into public/fontlib, one folder and one zip per family.
 * Every family keeps its own licence: the card shows it and the zip carries it.
 */
import list from "./fonts.json";
import { found, hasAll, type Found } from "./search";

export type FontFormat = "ttf" | "woff";
export type FontStyle = { file: string; files: FontFormat[] };
export type FontFamily = {
  slug: string;
  name: string;
  authors: string[];
  licence: string[];
  source?: string;
  tags: string[];
  /** never empty: the scan drops families without files */
  styles: [FontStyle, ...FontStyle[]];
};

export const fontFamilies = list as FontFamily[];

export const fontUrl = (f: FontFamily, s: FontStyle, k: FontFormat) =>
  `/fontlib/${f.slug}/${s.file}.${k}`;
export const fontZip = (f: FontFamily) => `/fontlib/${f.slug}.zip`;

/** The family name this page loads a style under: unique across the library. */
export const faceName = (f: FontFamily, s: FontStyle) => `fl ${f.slug} ${s.file}`;

/** The FontFace source list: WOFF first (smaller), TTF as the fallback. */
export const faceSrc = (f: FontFamily, s: FontStyle, origin = "") =>
  (["woff", "ttf"] as const)
    .filter((k) => s.files.includes(k))
    .map((k) => `url("${origin}${fontUrl(f, s, k)}") format("${k === "ttf" ? "truetype" : k}")`)
    .join(", ");

/** The rule a visitor copies for their own site; the files allow any origin (public/_headers). */
export const faceCss = (f: FontFamily, s: FontStyle, origin: string) =>
  `@font-face {\n  font-family: "${s.file}";\n  src: ${faceSrc(f, s, origin)};\n  font-display: swap;\n}\n/* ${f.name}: ${f.licence.join(" + ") || "see the source"} */\n.my-text { font-family: "${s.file}", sans-serif; }\n`;

const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** "SourceSansPro-SemiboldIt" in family source-sans-pro reads "Semibold It". */
export function styleLabel(f: FontFamily, s: FontStyle): string {
  const want = alnum(f.slug);
  let rest = s.file;
  if (alnum(s.file).startsWith(want)) {
    let seen = 0;
    let i = 0;
    while (i < s.file.length && seen < want.length) if (/[a-z0-9]/i.test(s.file[i++] ?? "")) seen++;
    rest = s.file.slice(i);
  }
  const label = rest
    .replace(/[-_.]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return label || "Regular";
}

/** The style a card opens on: the plain weight when there is one. */
export const defaultStyle = (f: FontFamily): FontStyle =>
  f.styles.find((s) => /^(regular|book|normal|roman)$/i.test(styleLabel(f, s))) ??
  f.styles.find((s) => /regular/i.test(s.file)) ??
  f.styles[0];

/** Tags on at least `min` families, most used first. */
export function topTags(fams: readonly FontFamily[], n: number): string[] {
  const count = new Map<string, number>();
  for (const f of fams) for (const t of new Set(f.tags)) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([t]) => t);
}

export const familyText = (f: FontFamily) => [f.name, f.slug, ...f.authors, ...f.tags];

export function filterFonts(fams: readonly FontFamily[], q: string, tag: string): FontFamily[] {
  return fams.filter((f) => (tag === "all" || f.tags.includes(tag)) && hasAll(q, familyText(f)));
}

/** filterFonts, or the closest families when the words find none (inside the tag if it holds any). */
export function searchFonts(
  fams: readonly FontFamily[],
  q: string,
  tag: string,
): Found<FontFamily> {
  const pool = filterFonts(fams, "", tag);
  return found(filterFonts(fams, q, tag), pool.length ? pool : fams, q, familyText, 18);
}
