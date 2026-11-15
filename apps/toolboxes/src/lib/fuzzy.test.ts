import { describe, expect, it } from "vitest";
import { closeness, distance, rank } from "./fuzzy";

const items = [
  { name: "แปลง PDF เป็น Word", terms: "แปลง pdf เป็น word pdf-to-word" },
  { name: "สร้าง QR code", terms: "สร้าง qr code qr-code-generator" },
  { name: "บีบอัดรูปภาพ", terms: "บีบอัดรูปภาพ image-compressor compress" },
];

describe("fuzzy search", () => {
  it("counts swaps as one edit", () => {
    expect(distance("qr", "rq")).toBe(1);
    expect(distance("kitten", "sitting")).toBe(3);
  });

  it("finds exact words first", () => {
    const { hits, exact } = rank(items, "qr");
    expect(exact).toBe(true);
    expect(hits[0]?.name).toBe("สร้าง QR code");
  });

  it("suggests the nearest item on a typo instead of nothing", () => {
    const { hits, exact } = rank(items, "compres");
    expect(exact).toBe(true);
    const typo = rank(items, "comprsess");
    expect(typo.exact).toBe(false);
    expect(typo.hits[0]?.name).toBe("บีบอัดรูปภาพ");
    expect(rank(items, "wrod").hits[0]?.name).toBe("แปลง PDF เป็น Word");
    expect(hits.length).toBeGreaterThan(0);
  });

  it("ignores noise", () => {
    expect(rank(items, "zzzzzzzz").hits).toEqual([]);
    expect(closeness("", "pdf")).toBe(0);
  });
});
