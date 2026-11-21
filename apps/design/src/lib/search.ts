/**
 * One search rule for every catalogue on the site (parts, Thai and Latin fonts, React Bits, app
 * templates). A query never ends on an empty page:
 *   1. every word of the query appears somewhere in the item's text (any order, any field);
 *   2. otherwise the query retyped in the other keyboard layout (Thai Kedmanee <-> QWERTY), for
 *      "typed with the wrong language on";
 *   3. otherwise the closest items by shared letter pairs and edit distance ("ใกล้เคียง").
 */

export const norm = (s: string) => s.normalize("NFC").toLowerCase().trim();
export const words = (q: string) => norm(q).split(/\s+/).filter(Boolean);

/** Every word appears in the fields (substring, so Thai without spaces still matches). */
export function hasAll(q: string | readonly string[], fields: readonly string[]): boolean {
  const ws = typeof q === "string" ? words(q) : q;
  if (!ws.length) return true;
  const hay = norm(fields.join(" "));
  return ws.every((w) => hay.includes(w));
}

// same key, both layouts: unshifted rows, then the shifted keys that carry Thai letters
const EN = "1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./QERTYUIOPASDFGHJKLCVBN<>{:^";
const TH = "ๅ/-ภถุึคตจขชๆไำพะัีรนยบลฃฟหกดเ้่าสวงผปแอิืทมใฝ๐ฎฑธํ๊ณฯญฤฆฏโฌ็๋ษศฉฮฺ์ฒฬฐซู";
const en = Array.from(EN);
const th = Array.from(TH);
const toTh = new Map(en.map((c, i) => [c, th[i] ?? c]));
const toEn = new Map(th.map((c, i) => [c, en[i] ?? c]));
const THAI = /[฀-๿]/;

/** The same keystrokes in the other layout: "ป่ทอ" -> "xjmv"... and "uok" -> "ีนา". */
export function swapLayout(q: string): string {
  const thai = THAI.test(q);
  return Array.from(q, (c) => (thai ? (THAI.test(c) ? toEn.get(c) : c) : toTh.get(c)) ?? c).join(
    "",
  );
}

const pairs = (s: string) => {
  const a = Array.from(s);
  const out = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) out.add(`${a[i]}${a[i + 1]}`);
  return out;
};

/** Edit distance where swapping two neighbours counts as one edit ("glwo" is 1 from "glow"). */
export function editDistance(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  let prev2: number[] = [];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      let d = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1])
        d = Math.min(d, (prev2[j - 2] ?? 0) + 1);
      row.push(d);
    }
    prev2 = prev;
    prev = row;
  }
  return prev[y.length] ?? 0;
}

/** 0..1: how close the query is to the fields, word by word. */
export function similarity(q: string, fields: readonly string[]): number {
  const ws = words(q);
  if (!ws.length) return 0;
  const hay = norm(fields.join(" "));
  const hayPairs = pairs(hay);
  const hayWords = [...new Set(hay.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean))];
  let total = 0;
  for (const w of ws) {
    const p = pairs(w);
    let hit = 0;
    for (const x of p) if (hayPairs.has(x)) hit++;
    // letter pairs cover typos inside long Thai runs that have no spaces to split on
    const cover = p.size ? hit / p.size : hay.includes(w) ? 1 : 0;
    let edit = 0;
    for (const h of hayWords) {
      const len = Math.max(w.length, h.length);
      if (Math.abs(h.length - w.length) > 2 || len > 24) continue;
      edit = Math.max(edit, 1 - editDistance(w, h) / len);
    }
    total += Math.max(cover * 0.9, edit);
  }
  return total / ws.length;
}

export type Rescue<T> = { items: T[]; how: "layout" | "near"; q: string };

/**
 * For a query with no plain hit: the hits of the query in the other keyboard layout, or else the `n`
 * closest items (closest first, list order on ties). Empty only when `items` is empty.
 */
export function rescue<T>(
  items: readonly T[],
  q: string,
  text: (t: T) => readonly string[],
  n = 12,
): Rescue<T> {
  const swapped = swapLayout(q);
  if (swapped !== q) {
    const sw = words(swapped);
    const hits = items.filter((t) => hasAll(sw, text(t)));
    if (hits.length) return { items: hits, how: "layout", q: swapped };
  }
  const scored = items.map((t, i) => {
    const fields = text(t);
    return { t, i, s: Math.max(similarity(q, fields), similarity(swapped, fields)) };
  });
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  return { items: scored.slice(0, n).map((x) => x.t), how: "near", q };
}

export type Found<T> = { items: T[]; rescue: Rescue<T> | null };

/** Plain hits when there are any (or no query); otherwise the rescue drawn from `pool`. */
export function found<T>(
  hits: T[],
  pool: readonly T[],
  q: string,
  text: (t: T) => readonly string[],
  n?: number,
): Found<T> {
  if (hits.length || !words(q).length || !pool.length) return { items: hits, rescue: null };
  const r = rescue(pool, q, text, n);
  return { items: r.items, rescue: r };
}
