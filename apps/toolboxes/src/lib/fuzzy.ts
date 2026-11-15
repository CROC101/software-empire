/** Typo-tolerant matching for the search palette: exact words first, else the closest names. */

const norm = (s: string) => s.toLocaleLowerCase("th").normalize("NFC").trim();

/** Edit distance (insert, delete, replace, swap of two neighbours), capped for speed. */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length || !b.length) return Math.max(a.length, b.length);
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
    }
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

/** 0..1, how close the query is to the best word (or word start) of a text. */
export function closeness(query: string, text: string): number {
  const q = norm(query);
  if (!q) return 0;
  let best = 0;
  for (const word of norm(text).split(/[\s\-_/·,()]+/u)) {
    if (!word) continue;
    // compare against the start of long words too, so "pdff" still finds "pdf-to-word"
    for (const w of new Set([word, word.slice(0, q.length + 1)])) {
      const score = 1 - distance(q, w) / Math.max(q.length, w.length);
      if (score > best) best = score;
    }
  }
  return best;
}

export type Searchable = { terms: string; name: string };

/**
 * Every word of the query found in the item's terms = a match, ranked by where it hits.
 * Nothing matches = `exact: false` and the items nearest the query (spelling mistakes).
 */
export function rank<T extends Searchable>(
  items: readonly T[],
  query: string,
  limit = 30,
): { hits: T[]; exact: boolean } {
  const q = norm(query);
  if (!q) return { hits: items.slice(0, limit), exact: true };
  const words = q.split(/\s+/u);
  const exact = items
    .map((item) => {
      const terms = norm(item.terms);
      if (!words.every((w) => terms.includes(w))) return null;
      const name = norm(item.name);
      const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2;
      return { item, score: score * 1000 + name.length };
    })
    .filter((x) => x !== null)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.item);
  if (exact.length) return { hits: exact.slice(0, limit), exact: true };
  const near = items
    .map((item) => ({ item, score: closeness(q, item.terms) }))
    .filter((x) => x.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
  return { hits: near.slice(0, 6), exact: false };
}
