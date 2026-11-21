/**
 * One index over every catalogue on the site, for the Ctrl/⌘K palette: parts, Thai fonts (loaded on
 * first open), Latin fonts, React Bits and app templates. Each hit links to its own page, filtered to
 * it. Pure data, so it is unit tested.
 */
import { categories, kinds, kindOf, registry } from "@/registry/meta";
import { fontFamilies } from "./fonts";
import { entryText, rank, sortEntries } from "./library";
import data from "./react-bits.json";
import { found, hasAll, type Found } from "./search";
import { templates } from "./templates";
import { fontText, type ThaiIndex } from "./thai-fonts";

export const GROUPS = {
  part: "ชิ้นส่วน",
  thai: "ฟอนต์ไทย",
  latin: "ฟอนต์อังกฤษ",
  bits: "React Bits",
  app: "เทมเพลตแอป",
} as const;
export type Group = keyof typeof GROUPS;

export type Hit = {
  key: string;
  group: Group;
  name: string;
  sub: string;
  href: string;
  text: string[];
};

const q = (s: string) => `?q=${encodeURIComponent(s)}`;
const parts: Hit[] = sortEntries(registry, "popular").map((e) => ({
  key: `part:${e.slug}`,
  group: "part",
  name: e.name,
  sub: `${kinds[kindOf(e)]} · ${categories[e.category].label}`,
  href: `/c/${e.slug}`,
  text: entryText(e),
}));
const rest: Hit[] = [
  ...fontFamilies.map((f) => ({
    key: `latin:${f.slug}`,
    group: "latin" as const,
    name: f.name,
    sub: `ฟอนต์อังกฤษ · ${f.authors.join(", ") || f.tags.slice(0, 2).join(", ")}`,
    href: `/fonts/en${q(f.name)}`,
    text: [f.name, f.slug, ...f.authors, ...f.tags, "font ฟอนต์"],
  })),
  ...data.categories.flatMap((c) =>
    c.items.map((it) => ({
      key: `bits:${it.component}`,
      group: "bits" as const,
      name: it.title,
      sub: `React Bits · ${c.name}`,
      href: `/react-bits${q(it.title)}`,
      text: [it.title, it.component, c.name, "react bits"],
    })),
  ),
  ...templates.map((t) => ({
    key: `app:${t.slug}`,
    group: "app" as const,
    name: t.name,
    sub: `เทมเพลตแอป · ${t.stack}`,
    href: `/templates${q(t.name)}`,
    text: [t.name, t.slug, t.about, t.stack, t.inspired.name, "template เทมเพลต แอป"],
  })),
];

export const thaiHits = (index: ThaiIndex): Hit[] =>
  index.fonts.map((f) => ({
    key: `thai:${f.i}`,
    group: "thai",
    name: f.n,
    sub: `ฟอนต์ไทย · ${index.authors[f.a] ?? "f0nt.com"}`,
    href: `/fonts${q(f.n)}`,
    text: [...fontText(index, f), "ฟอนต์ไทย thai font"],
  }));

/**
 * Hits for `query` inside `group` ("" = all), parts ranked by the fuzzy part score first. With no
 * plain hit it falls back to the layout swap, then the closest items, so it never comes back empty.
 */
export function searchAll(
  query: string,
  group: Group | "",
  thai: readonly Hit[] = [],
  n = 40,
): Found<Hit> {
  const pool = [...parts, ...thai, ...rest].filter((h) => !group || h.group === group);
  if (!query.trim()) return { items: pool.slice(0, n), rescue: null };
  const ranked = new Map(registry.map((e) => [`part:${e.slug}`, rank(e, query)]));
  const hits = pool
    .map((h, i) => ({
      h,
      i,
      r: h.group === "part" ? (ranked.get(h.key) ?? 0) : hasAll(query, h.text) ? 1 : 0,
    }))
    .filter((x) => x.r > 0)
    .sort((a, b) => (a.h.group === "part" && b.h.group === "part" ? b.r - a.r : 0) || a.i - b.i)
    .map((x) => x.h);
  const out = found(hits, pool, query, (h) => h.text, 16);
  return { ...out, items: out.items.slice(0, n) };
}
