/**
 * Library views over the registry: sort orders, badges and the URL-hash state of the gallery.
 * Plain functions, so the gallery, the command palette and the tests share them.
 */
import {
  categories,
  kindOf,
  kinds,
  registry,
  type Category,
  type Entry,
  type Kind,
} from "@/registry/meta";

export type Sort = "popular" | "new" | "az";
export const sorts: Record<Sort, string> = { popular: "ยอดนิยม", new: "มาใหม่", az: "A–Z" };

export type View = {
  kind: Kind | "all";
  cat: Category | "all";
  sort: Sort;
  q: string;
  fav: boolean;
};
export const initialView: View = { kind: "all", cat: "all", sort: "popular", q: "", fav: false };

const order = new Map(registry.map((e, i) => [e.slug, i]));
const pos = (e: Entry) => order.get(e.slug) ?? 0;

/** Newer date first; within a day, later in the registry = added later. */
const byNew = (a: Entry, b: Entry) => b.added.localeCompare(a.added) || pos(b) - pos(a);
const byPopular = (a: Entry, b: Entry) =>
  (a.rank ?? Infinity) - (b.rank ?? Infinity) || byNew(a, b);
const byName = (a: Entry, b: Entry) => a.name.localeCompare(b.name, "en");

export function sortEntries(list: readonly Entry[], sort: Sort): Entry[] {
  return [...list].sort(sort === "new" ? byNew : sort === "az" ? byName : byPopular);
}

const newest = new Set(
  sortEntries(registry, "new")
    .slice(0, 12)
    .map((e) => e.slug),
);
export const isNew = (e: Entry) => newest.has(e.slug);
export const isHot = (e: Entry) => e.rank !== undefined && e.rank <= 10;

export function matches(e: Entry, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [e.name, e.slug, e.summary, categories[e.category].label, ...e.blend].some((x) =>
    x.toLowerCase().includes(s),
  );
}

/** Query characters in order inside text (Raycast-style). Higher is tighter: runs and word starts score more; 0 = no match. */
export function fuzzy(text: string, q: string): number {
  const t = text.toLowerCase();
  let from = 0;
  let last = -2;
  let run = 0;
  let score = 0;
  for (const ch of q) {
    const j = t.indexOf(ch, from);
    if (j < 0) return 0;
    run = j === last + 1 ? run + 1 : 1;
    score += run + (j === 0 || " -".includes(t[j - 1] ?? "") ? 2 : 0);
    last = j;
    from = j + 1;
  }
  return score;
}

/** Palette ranking: fuzzy on name and slug first, then a plain substring hit on the rest scores 1. */
export function rank(e: Entry, q: string): number {
  const s = q.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return 1;
  return Math.max(fuzzy(e.name, s), fuzzy(e.slug, s)) * 2 || (matches(e, q) ? 1 : 0);
}

export function filterEntries(list: readonly Entry[], v: View, favs: ReadonlySet<string>): Entry[] {
  return sortEntries(
    list.filter(
      (e) =>
        (v.kind === "all" || kindOf(e) === v.kind) &&
        (v.cat === "all" || e.category === v.cat) &&
        (!v.fav || favs.has(e.slug)) &&
        matches(e, v.q),
    ),
    v.sort,
  );
}

const isKind = (x: string | null): x is Kind => x !== null && x in kinds;
const isCat = (x: string | null): x is Category => x !== null && x in categories;
const isSort = (x: string | null): x is Sort => x !== null && x in sorts;

/** The hash is visitor input: unknown keys fall back to defaults, the query is capped. */
export function parseView(hash: string): View {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const cat = p.get("c");
  const kind = p.get("k");
  const sort = p.get("s");
  return {
    cat: isCat(cat) ? cat : "all",
    kind: isCat(cat) ? categories[cat].kind : isKind(kind) ? kind : "all",
    sort: isSort(sort) ? sort : "popular",
    q: (p.get("q") ?? "").slice(0, 60),
    fav: p.get("f") === "1",
  };
}

export function viewHash(v: View): string {
  const p = new URLSearchParams();
  if (v.cat !== "all") p.set("c", v.cat);
  else if (v.kind !== "all") p.set("k", v.kind);
  if (v.sort !== "popular") p.set("s", v.sort);
  if (v.q) p.set("q", v.q);
  if (v.fav) p.set("f", "1");
  const s = p.toString();
  return s ? `#${s}` : "";
}

export const countBy = (pred: (e: Entry) => boolean) => registry.filter(pred).length;
