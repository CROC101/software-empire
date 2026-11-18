import { describe, expect, it } from "vitest";
import type { Video } from "@/lib/api";
import { GENRES, isNew, perRow, pickHero } from "./movies";

const v = (id: string): Video => ({
  youtube_id: id.padEnd(11, "x"),
  kind: "movie",
  title: id,
  author: "a",
  created_at: "2026-11-01T00:00:00Z",
});

describe("perRow", () => {
  it("follows the reference's steps", () => {
    expect([390, 500, 800, 1100, 1440].map(perRow)).toEqual([2, 3, 4, 5, 6]);
  });
});

describe("pickHero", () => {
  it("prefers what the viewer is part way through", () => {
    expect(pickHero([v("r")], [v("a"), v("b")])?.title).toBe("r");
  });
  it("rotates the pool by day and is empty without one", () => {
    expect(pickHero([], [v("a"), v("b")], 3)?.title).toBe("b");
    expect(pickHero([], [], 3)).toBeUndefined();
  });
});

describe("isNew", () => {
  it("means within 30 days", () => {
    const now = Date.parse("2026-11-18T00:00:00Z");
    expect(isNew("2026-11-01T00:00:00Z", now)).toBe(true);
    expect(isNew("2026-09-01T00:00:00Z", now)).toBe(false);
  });
});

it("genre ids are unique", () => {
  expect(new Set(GENRES.map((g) => g.id)).size).toBe(GENRES.length);
});
