import { describe, expect, it } from "vitest";
import { kindOf, registry } from "@/registry/meta";
import {
  filterEntries,
  fuzzy,
  initialView,
  isHot,
  isNew,
  parseView,
  rank,
  sortEntries,
  viewHash,
} from "./library";

describe("library views", () => {
  it("round-trips the hash and ignores junk", () => {
    const v = {
      ...initialView,
      cat: "hero" as const,
      kind: "block" as const,
      ver: "lite" as const,
      sort: "new" as const,
      q: "แสง",
      fav: true,
    };
    expect(parseView(viewHash(v))).toEqual(v);
    expect(parseView("#c=<script>&k=nope&v=x&s=zzz&q=" + "x".repeat(200))).toEqual({
      ...initialView,
      q: "x".repeat(60),
    });
    expect(viewHash(initialView)).toBe("");
  });

  it("puts ranked parts first under popular and the newest first under new", () => {
    const pop = sortEntries(registry, "popular");
    expect(pop[0]?.rank).toBe(1);
    const fresh = sortEntries(registry, "new");
    expect((fresh[0]?.added ?? "") >= (fresh.at(-1)?.added ?? "")).toBe(true);
    expect(registry.filter(isNew)).toHaveLength(12);
    expect(registry.filter(isHot).length).toBeGreaterThan(0);
  });

  it("filters by kind, category, favourites and text", () => {
    const originals = filterEntries(registry, { ...initialView, ver: "original" }, new Set());
    const lites = filterEntries(registry, { ...initialView, ver: "lite" }, new Set());
    expect(originals.length).toBeGreaterThan(0);
    expect(originals.every((e) => e.slug.endsWith("-original") && kindOf(e) === "exclusive")).toBe(
      true,
    );
    // every original has its Lite rewrite under the same slug without the suffix
    const liteSlugs = new Set(lites.map((e) => e.slug));
    expect(originals.every((e) => liteSlugs.has(e.slug.replace(/-original$/, "")))).toBe(true);
    const blocks = filterEntries(registry, { ...initialView, kind: "block" }, new Set());
    expect(blocks.length).toBeGreaterThan(0);
    expect(
      filterEntries(registry, { ...initialView, fav: true }, new Set(["dock"])).map((e) => e.slug),
    ).toEqual(["dock"]);
    expect(filterEntries(registry, { ...initialView, q: "zzzz-none" }, new Set())).toEqual([]);
  });
});

describe("palette search", () => {
  it("matches characters in order and prefers runs and word starts", () => {
    expect(fuzzy("Magnify Dock", "mdk")).toBeGreaterThan(0);
    expect(fuzzy("Magnify Dock", "kdm")).toBe(0);
    expect(fuzzy("Magnify Dock", "dock")).toBeGreaterThan(fuzzy("Magnify Dock", "mgdk"));
  });

  it("ranks the closest part first and still finds category words", () => {
    const top = [...registry].sort((a, b) => rank(b, "dock") - rank(a, "dock"))[0];
    expect(top?.slug).toBe("dock");
    expect(registry.some((e) => rank(e, "zzzzqq") > 0)).toBe(false);
  });
});
