import { describe, expect, it } from "vitest";
import { cardAt, DECK } from "./deck";
import { bangkokDay, dailyCard, draw, interpret, secureIndex } from "./reading";

describe("deck", () => {
  it("has 78 different cards, each with every meaning filled in", () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
    for (const c of DECK) {
      expect(c.th && c.en && c.up && c.rev && c.advice, c.id).toBeTruthy();
      expect(c.keywords.length, c.id).toBeGreaterThan(0);
    }
    expect(DECK.find((c) => c.id === "m04")?.en).toBe("The Emperor");
    expect(DECK.find((c) => c.id === "cups14")?.en).toBe("King of Cups");
  });
});

describe("daily card", () => {
  it("is the same all day for one person and changes with the day or the person", () => {
    const a = dailyCard("u1", "2026-11-06");
    expect(dailyCard("u1", "2026-11-06")).toEqual(a);
    const others = ["2026-11-07", "2026-11-08", "2026-11-09"].map(
      (d) => dailyCard("u1", d).card.id,
    );
    expect(others.some((id) => id !== a.card.id)).toBe(true);
  });

  it("counts days in Bangkok time", () => {
    // 17:30 UTC on the 5th is already 00:30 on the 6th in Bangkok
    expect(bangkokDay(new Date("2026-11-05T17:30:00Z"))).toBe("2026-11-06");
  });
});

describe("draw", () => {
  it("never repeats a card in one spread", () => {
    let seed = 1;
    const index = (below: number) => (seed = (seed * 16807) % 2147483647) % below;
    const cards = draw(10, index).map((d) => d.card.id);
    expect(new Set(cards).size).toBe(10);
  });

  it("draws unbiased indexes in range", () => {
    for (let i = 0; i < 200; i++) {
      const x = secureIndex(78);
      expect(Number.isInteger(x) && x >= 0 && x < 78).toBe(true);
    }
  });

  it("adds the topic lens after the card's own meaning", () => {
    const drawn = { card: cardAt(0), reversed: false };
    expect(interpret(drawn, "general")).toBe(cardAt(0).up);
    expect(interpret(drawn, "love")).toContain(cardAt(0).up);
    expect(interpret(drawn, "love").length).toBeGreaterThan(cardAt(0).up.length);
  });
});
