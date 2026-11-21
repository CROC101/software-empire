/**
 * The Thai font index on /fonts, from f0nt.com (`node tools/f0nt.mjs` writes public/data/f0nt.json).
 * Nothing is rehosted: pictures and downloads load from f0nt.com, so each designer's terms,
 * counter and page stay theirs. This file holds the pure parts: filters, facets and the URL state.
 */

export type ThaiFont = {
  /** post id */
  i: number;
  /** name as the post titles it, usually "ไทย (Latin)" */
  n: string;
  /** post slug: https://www.f0nt.com/release/<s>/ */
  s: string;
  /** posted, YYYY-MM-DD */
  d: string;
  /** designer id (the WordPress author on f0nt.com) */
  a: number;
  /** licence letters: c = free for commercial use, p = free for personal use, d = demo */
  l: string;
  t: number[];
  /** download names for f0nt.com's own download manager */
  dl: string[];
  /** preview picture under wp-content/uploads, "" when the post has none */
  img: string;
};

export type ThaiIndex = {
  source: string;
  fetched: string;
  tags: Record<string, [name: string, count: number]>;
  authors: Record<string, string>;
  fonts: ThaiFont[];
};

const SITE = "https://www.f0nt.com";
const isStr = (x: unknown): x is string => typeof x === "string";
const isInt = (x: unknown): x is number => Number.isInteger(x);

/**
 * The fetched JSON is checked before use (it was scraped from another site): entries with a wrong
 * shape are dropped, paths must look like plain file paths, so nothing odd ends up in an href.
 */
export function parseIndex(raw: unknown): ThaiIndex | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.fonts) || !r.tags || typeof r.tags !== "object" || !r.authors) return null;
  // no %: encodeURI below would double-encode it
  const path = /^[\w\-./@()+ ~]+$/;
  const fonts = r.fonts.filter((f): f is ThaiFont => {
    if (!f || typeof f !== "object") return false;
    const x = f as Record<string, unknown>;
    return (
      isInt(x.i) &&
      isStr(x.n) &&
      isStr(x.s) &&
      /^[\w%-]+$/.test(x.s) &&
      isStr(x.d) &&
      /^\d{4}-\d{2}-\d{2}$/.test(x.d) &&
      isInt(x.a) &&
      isStr(x.l) &&
      /^[cdp]*$/.test(x.l) &&
      Array.isArray(x.t) &&
      x.t.every(isInt) &&
      Array.isArray(x.dl) &&
      x.dl.length > 0 &&
      x.dl.every((d) => isStr(d) && path.test(d) && !d.includes("..")) &&
      isStr(x.img) &&
      (x.img === "" || (path.test(x.img) && !x.img.includes("..")))
    );
  });
  return {
    source: isStr(r.source) ? r.source : SITE,
    fetched: isStr(r.fetched) ? r.fetched : "",
    tags: r.tags as ThaiIndex["tags"],
    authors: r.authors as ThaiIndex["authors"],
    fonts,
  };
}

// Thai slugs arrive percent-encoded from WordPress; parseIndex lets only [\w%-] through
export const postUrl = (f: ThaiFont) => `${SITE}/release/${f.s}/`;
export const downloadUrl = (dl: string) => `${SITE}/?dl_name=${encodeURI(dl)}`;
export const imageUrl = (f: ThaiFont) =>
  f.img ? `${SITE}/wp-content/uploads/${encodeURI(f.img)}` : "";

export const LICENCES = [
  ["c", "ใช้เชิงพาณิชย์ได้ฟรี", "เชิงพาณิชย์ได้"],
  ["p", "ใช้ส่วนตัวฟรี", "ใช้ส่วนตัว"],
  ["d", "ฟอนต์ตัวอย่าง (เดโม)", "เดโม"],
  // older posts predate f0nt.com's licence categories: the terms are only in the post itself
  ["u", "ไม่ได้ระบุ ดูที่หน้าต้นฉบับ", "ดูเงื่อนไขที่ต้นฉบับ"],
] as const;
/** a font's licence letters, "u" when the post has none */
export const licenceOf = (f: ThaiFont) => f.l || "u";
export type LicenceKey = (typeof LICENCES)[number][0];

/** f0nt.com tag names grouped into the facets the page offers; the rest sit under "แท็กอื่น". */
export const TAG_GROUPS = [
  {
    key: "style",
    label: "แบบตัวอักษร",
    tags: [
      "ลายมือ",
      "ไม่มีหัว",
      "display",
      "standard",
      "มาตรฐาน",
      "traditional",
      "อักษรวิจิตร",
      "calligraphy",
      "พู่กัน",
      "ปากกาหัวตัด",
      "หวัด",
      "บรรจง",
      "คัดลายมือ",
      "ชอล์ก",
      "อาลักษณ์",
      "ลายไทย",
      "กนก",
      "pixel",
      "digital",
      "3d",
      "colorfont",
      "variable font",
      "latin",
      "block",
      "เส้น",
    ],
  },
  {
    key: "shape",
    label: "รูปทรงและน้ำหนัก",
    tags: [
      "หนา",
      "บาง",
      "กว้าง",
      "แคบ",
      "ผอม",
      "อ้วน",
      "สูง",
      "เหลี่ยม",
      "มน",
      "กลม",
      "โค้ง",
      "ตัวเอียง",
      "หัวโต",
      "หัวทึบ",
      "ขรุขระ",
      "โย้เย้",
      "ยุกยิก",
      "ยึกยือ",
      "นุ่มนิ่ม",
      "ไก่เขี่ย",
    ],
  },
  {
    key: "mood",
    label: "อารมณ์",
    tags: [
      "น่ารัก",
      "วัยรุ่น",
      "เด็ก",
      "สนุก",
      "ตลก",
      "funny",
      "เรียบร้อย",
      "อ่อนช้อย",
      "อ่อนหวาน",
      "เป็นมิตร",
      "แข็งแรง",
      "แข็ง",
      "โหด",
      "สยอง",
      "ผี",
      "เลือด",
      "หรูหรา",
      "fancy",
      "แฟนซี",
      "minimal",
      "modern",
      "retro",
      "ย้อนยุค",
      "vintage",
      "โบราณ",
      "อนุรักษ์",
      "grunge",
      "hitech",
      "จอมยุทธ์",
      "เทพนิยาย",
      "fantasy",
      "experiment",
    ],
  },
  {
    key: "use",
    label: "เหมาะกับงาน",
    tags: [
      "logo",
      "ป้าย",
      "พาดหัว",
      "อ่านง่าย",
      "typography",
      "movies",
      "นิยาย",
      "การ์ตูน",
      "สติกเกอร์",
      "งานวัด",
      "วัด",
      "ร้านทอง",
      "ลูกทุ่ง",
      "ซิ่ง",
      "ริบบิ้น",
      "เอฟเฟกต์",
      "graphic",
    ],
  },
  { key: "lang", label: "กลิ่นอายภาษา", tags: ["จีน", "chinese", "เกาหลี", "ต่างประเทศ"] },
] as const;

export type Facet = { label: string; tags: { id: number; name: string }[] };

/** TAG_GROUPS resolved to the ids this index uses, plus the most used other tags. */
export function facets(index: ThaiIndex, others = 40): Facet[] {
  const byName = new Map<string, number>();
  for (const [id, [name]] of Object.entries(index.tags)) byName.set(name.toLowerCase(), Number(id));
  const grouped = new Set<number>();
  const out: Facet[] = TAG_GROUPS.map((g) => ({
    label: g.label,
    tags: g.tags.flatMap((name) => {
      const id = byName.get(name);
      if (id === undefined) return [];
      grouped.add(id);
      return [{ id, name: index.tags[id]?.[0] ?? name }];
    }),
  }));
  const rest = Object.entries(index.tags)
    .filter(([id]) => !grouped.has(Number(id)))
    .sort((a, b) => b[1][1] - a[1][1])
    .slice(0, others)
    .map(([id, [name]]) => ({ id: Number(id), name }));
  return [...out, { label: "แท็กอื่น", tags: rest }].filter((f) => f.tags.length);
}

export type Sort = "new" | "old" | "az";
export type ThaiState = {
  q: string;
  /** licence letters picked; a font matches when it has any of them */
  l: string;
  /** tag ids picked; a font must carry all of them */
  t: number[];
  y: string;
  a: number;
  sort: Sort;
  /** cards on screen, kept so a reload lands back on the same card */
  n: number;
};

export const PAGE = 60;
export const emptyState: ThaiState = { q: "", l: "", t: [], y: "", a: 0, sort: "new", n: PAGE };

/** URL query to state; anything unknown or malformed falls back to the default. */
export function readState(search: string): ThaiState {
  const p = new URLSearchParams(search);
  const sort = p.get("sort");
  const num = (k: string) => {
    const v = Number(p.get(k));
    return Number.isInteger(v) && v > 0 ? v : 0;
  };
  return {
    q: (p.get("q") ?? "").slice(0, 60),
    l: [...new Set((p.get("l") ?? "").replace(/[^cpdu]/g, ""))].sort().join(""),
    t: [...new Set((p.get("t") ?? "").split(",").map(Number))].filter(
      (x) => Number.isInteger(x) && x > 0,
    ),
    y: /^\d{4}$/.test(p.get("y") ?? "") ? (p.get("y") ?? "") : "",
    a: num("a"),
    sort: sort === "old" || sort === "az" ? sort : "new",
    n: Math.min(Math.max(num("n"), PAGE), 6000),
  };
}

/** State to URL query, leaving out what is at its default so plain /fonts stays plain. */
export function writeState(s: ThaiState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.l) p.set("l", s.l);
  if (s.t.length) p.set("t", s.t.join(","));
  if (s.y) p.set("y", s.y);
  if (s.a) p.set("a", String(s.a));
  if (s.sort !== "new") p.set("sort", s.sort);
  if (s.n > PAGE) p.set("n", String(s.n));
  const out = p.toString();
  return out ? `?${out}` : "";
}

function matches(index: ThaiIndex, f: ThaiFont, s: ThaiState): boolean {
  if (
    s.l &&
    !licenceOf(f)
      .split("")
      .some((c) => s.l.includes(c))
  )
    return false;
  if (s.y && !f.d.startsWith(s.y)) return false;
  if (s.a && f.a !== s.a) return false;
  if (s.t.some((id) => !f.t.includes(id))) return false;
  const q = s.q.trim().toLowerCase();
  if (!q) return true;
  return [f.n, f.s, index.authors[f.a] ?? "", ...f.t.map((id) => index.tags[id]?.[0] ?? "")].some(
    (x) => x.toLowerCase().includes(q),
  );
}

export function filterThai(index: ThaiIndex, s: ThaiState): ThaiFont[] {
  const out = index.fonts.filter((f) => matches(index, f, s));
  if (s.sort === "old") out.sort((a, b) => a.d.localeCompare(b.d) || a.i - b.i);
  else if (s.sort === "az") out.sort((a, b) => a.n.localeCompare(b.n, "th"));
  else out.sort((a, b) => b.d.localeCompare(a.d) || b.i - a.i);
  return out;
}

/** How many fonts each tag would leave if added to the current picks. */
export function tagCounts(index: ThaiIndex, s: ThaiState): Map<number, number> {
  const count = new Map<number, number>();
  for (const f of index.fonts) {
    if (!matches(index, f, s)) continue;
    for (const id of f.t) count.set(id, (count.get(id) ?? 0) + 1);
  }
  return count;
}

/** Licence and year counts ignore their own pick, so the other options stay visible. */
export function licenceCounts(index: ThaiIndex, s: ThaiState): Record<LicenceKey, number> {
  const out = { c: 0, p: 0, d: 0, u: 0 };
  const base = { ...s, l: "" };
  for (const f of index.fonts)
    if (matches(index, f, base)) for (const c of licenceOf(f)) if (c in out) out[c as LicenceKey]++;
  return out;
}

export const years = (index: ThaiIndex) =>
  [...new Set(index.fonts.map((f) => f.d.slice(0, 4)))].sort().reverse();

/** Designers with at least one font, most fonts first. */
export function designers(index: ThaiIndex): { id: number; name: string; count: number }[] {
  const count = new Map<number, number>();
  for (const f of index.fonts) count.set(f.a, (count.get(f.a) ?? 0) + 1);
  return [...count]
    .filter(([id]) => index.authors[id])
    .map(([id, n]) => ({ id, name: index.authors[id] ?? "", count: n }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"));
}
