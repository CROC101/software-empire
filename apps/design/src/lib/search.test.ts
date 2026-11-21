import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry/meta";
import { searchAll, thaiHits } from "./everything";
import { fontFamilies, searchFonts } from "./fonts";
import { initialView, searchEntries } from "./library";
import { editDistance, found, hasAll, rescue, similarity, swapLayout } from "./search";
import { emptyState, parseIndex, searchThai, type ThaiIndex } from "./thai-fonts";

describe("search", () => {
  it("every word, any order, any field, Thai or Latin", () => {
    expect(hasAll("glow card", ["Card", "border glow"])).toBe(true);
    expect(hasAll("ปุ่ม เรือง", ["ปุ่มเรืองแสง"])).toBe(true);
    expect(hasAll("glow nope", ["glow"])).toBe(false);
    expect(hasAll("", ["x"])).toBe(true);
  });

  it("retypes the query in the other keyboard layout", () => {
    expect(swapLayout("ป่ทอ")).toBe("xjmv");
    expect(swapLayout("xjmv")).toBe("ป่ทอ");
    expect(swapLayout("uok")).toBe("ีนา");
    expect(swapLayout("l;ylfu")).toBe("สวัสดี");
  });

  it("a swap of two neighbours is one edit", () => {
    expect(editDistance("glwo", "glow")).toBe(1);
    expect(editDistance("glow", "glow")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
  });

  it("near items rank by how close they are", () => {
    expect(similarity("aurra", ["Aurora"])).toBeGreaterThan(similarity("aurra", ["Dock"]));
    const r = rescue(["Dock", "Aurora", "Glitch"], "auroar", (x) => [x]);
    expect(r.how).toBe("near");
    expect(r.items[0]).toBe("Aurora");
  });

  it("wrong layout finds the plain hits", () => {
    const r = rescue(["สวัสดี", "ลาก่อน"], "l;ylfu", (x) => [x]);
    expect(r).toMatchObject({ how: "layout", q: "สวัสดี", items: ["สวัสดี"] });
  });

  it("found: plain hits stay plain, no hits never come back empty", () => {
    const pool = ["alpha", "beta"];
    expect(found(["alpha"], pool, "alp", (x) => [x])).toEqual({ items: ["alpha"], rescue: null });
    expect(found([], pool, "", (x) => [x]).rescue).toBeNull();
    const miss = found([], pool, "qqqqzz", (x) => [x]);
    expect(miss.items.length).toBeGreaterThan(0);
    expect(miss.rescue?.how).toBe("near");
  });
});

describe("every catalogue falls back to the nearest", () => {
  it("parts", () => {
    const hit = searchEntries(registry, { ...initialView, q: registry[0]?.name ?? "" }, new Set());
    expect(hit.rescue).toBeNull();
    const typo = searchEntries(registry, { ...initialView, q: "zzzz-none" }, new Set());
    expect(typo.items.length).toBeGreaterThan(0);
    expect(typo.rescue).not.toBeNull();
  });

  it("Latin fonts", () => {
    const name = fontFamilies[0]?.name ?? "";
    expect(searchFonts(fontFamilies, name, "all").rescue).toBeNull();
    const typo = searchFonts(fontFamilies, `${name.slice(0, -1)}q`, "all");
    expect(typo.items).toContain(fontFamilies[0]);
  });

  const index = parseIndex(
    JSON.parse(readFileSync(new URL("../../public/data/f0nt.json", import.meta.url), "utf8")),
  ) as ThaiIndex;

  it("Thai fonts, typo", () => {
    const s = index.fonts.find((x) => /^[a-z]+$/i.test(x.s) && x.s.length > 5)?.s ?? "";
    expect(searchThai(index, { ...emptyState, q: s }).rescue).toBeNull();
    const typo = searchThai(index, { ...emptyState, q: `${s.slice(0, -1)}#` });
    expect(typo.items.length).toBeGreaterThan(0);
    expect(typo.rescue?.how).toBe("near");
  });

  it("the site search mixes every kind and keeps one on request", () => {
    const thai = thaiHits(index);
    const all = searchAll("", "", thai);
    expect(all.items.length).toBe(40);
    expect(new Set(searchAll("", "app", thai).items.map((h) => h.group))).toEqual(new Set(["app"]));
    expect(searchAll("font", "", thai).items.some((h) => h.group !== "part")).toBe(true);
    const lost = searchAll("qqxxzzwv", "", thai);
    expect(lost.items.length).toBeGreaterThan(0);
    expect(lost.rescue).not.toBeNull();
  });
});
