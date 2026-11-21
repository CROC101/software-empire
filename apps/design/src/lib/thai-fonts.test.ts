import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  downloadUrl,
  emptyState,
  facets,
  filterThai,
  licenceCounts,
  parseIndex,
  postUrl,
  readState,
  tagCounts,
  writeState,
  type ThaiFont,
  type ThaiIndex,
} from "./thai-fonts";

const font = (o: Partial<ThaiFont>): ThaiFont => ({
  i: 1,
  n: "ก",
  s: "a",
  d: "2026-01-01",
  a: 1,
  l: "",
  t: [],
  dl: ["x/a.zip"],
  img: "",
  ...o,
});
const index: ThaiIndex = {
  source: "https://www.f0nt.com",
  fetched: "2026-11-21",
  tags: { 13: ["ลายมือ", 2], 35: ["น่ารัก", 1], 99: ["อื่นๆ", 1] },
  authors: { 1: "RD Studio", 2: "TCHA" },
  fonts: [
    font({ i: 1, n: "สลัดโรล (RDSaladroll)", d: "2026-11-21", l: "dp", t: [13, 35] }),
    font({ i: 2, n: "โบนัส (TCHA-Bonus)", d: "2025-05-01", a: 2, l: "c", t: [13] }),
    font({ i: 3, n: "กาแฟ", d: "2005-01-01", a: 2, t: [99] }),
  ],
};
const ids = (s = emptyState) => filterThai(index, s).map((f) => f.i);

describe("thai font index", () => {
  it("filters by tags (all must match), licence (any), year, designer and text", () => {
    expect(ids()).toEqual([1, 2, 3]);
    expect(ids({ ...emptyState, t: [13, 35] })).toEqual([1]);
    expect(ids({ ...emptyState, l: "cd" })).toEqual([1, 2]);
    expect(ids({ ...emptyState, l: "u" })).toEqual([3]);
    expect(ids({ ...emptyState, y: "2025" })).toEqual([2]);
    expect(ids({ ...emptyState, a: 2 })).toEqual([2, 3]);
    expect(ids({ ...emptyState, q: "tcha" })).toEqual([2, 3]); // name or designer
    expect(ids({ ...emptyState, q: "น่ารัก" })).toEqual([1]); // tag name
    expect(ids({ ...emptyState, sort: "old" })).toEqual([3, 2, 1]);
  });

  it("counts tags within the current picks and licences ignoring their own pick", () => {
    const s = { ...emptyState, t: [13], l: "c" };
    expect(tagCounts(index, s).get(13)).toBe(1);
    expect(licenceCounts(index, s)).toEqual({ c: 1, p: 1, d: 1, u: 0 });
  });

  it("groups known tag names and keeps the rest under other tags", () => {
    const f = facets(index);
    expect(f.find((g) => g.label === "แบบตัวอักษร")?.tags.map((t) => t.id)).toEqual([13]);
    expect(f.at(-1)).toEqual({ label: "แท็กอื่น", tags: [{ id: 99, name: "อื่นๆ" }] });
  });

  it("round-trips state through the URL and ignores junk", () => {
    const s = {
      ...emptyState,
      q: "ลาย",
      l: "cp",
      t: [13, 35],
      y: "2024",
      a: 7,
      sort: "az" as const,
      n: 120,
    };
    expect(readState(writeState(s))).toEqual(s);
    expect(writeState(emptyState)).toBe("");
    expect(readState("?l=x<c&t=1,abc,-2&y=20&sort=evil&n=99999")).toEqual({
      ...emptyState,
      l: "c",
      t: [1],
      n: 6000,
    });
  });

  it("drops entries whose paths could break out of an href", () => {
    const raw = {
      ...index,
      fonts: [
        font({}),
        font({ dl: ['a.zip" onclick="x'] }),
        font({ dl: ["../../wp-config.php"] }),
        font({ img: "javascript:alert(1)" }),
        font({ s: "a/../b" }),
        { i: "1" },
      ],
    };
    expect(parseIndex(raw)?.fonts).toHaveLength(1);
    expect(parseIndex(null)).toBeNull();
    expect(parseIndex({ ...index, fonts: [font({ dl: ["a%2522.zip"] })] })?.fonts).toEqual([]);
    expect(downloadUrl("rd/A B.zip")).toBe("https://www.f0nt.com/?dl_name=rd/A%20B.zip");
    expect(postUrl(font({ s: "%e0%b9%81-can" }))).toBe(
      "https://www.f0nt.com/release/%e0%b9%81-can/",
    );
  });

  it("the committed snapshot parses whole", () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL("../../public/data/f0nt.json", import.meta.url), "utf8"),
    );
    const parsed = parseIndex(raw);
    expect(parsed?.fonts.length).toBe((raw as ThaiIndex).fonts.length);
    expect(parsed?.fonts.length).toBeGreaterThan(3000);
  });
});
