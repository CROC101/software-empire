import { describe, expect, it } from "vitest";
import { type Video } from "@/lib/api";
import { frameAt } from "@/lib/youtube";
import { topChannels } from "./videos";

const v = (youtube_id: string, author: string): Video => ({
  youtube_id,
  author,
  kind: "video",
  title: youtube_id,
  created_at: "2026-01-01T00:00:00Z",
});

describe("frameAt", () => {
  it("splits the card into 3 frames and clamps the edges", () => {
    expect(frameAt(0, 300)).toBe(1);
    expect(frameAt(99, 300)).toBe(1);
    expect(frameAt(100, 300)).toBe(2);
    expect(frameAt(299, 300)).toBe(3);
    expect(frameAt(300, 300)).toBe(3);
    expect(frameAt(-5, 300)).toBe(1);
    expect(frameAt(10, 0)).toBe(1);
  });
});

describe("topChannels", () => {
  it("puts the busiest channels first, keeps list order on ties, and caps the count", () => {
    const list = [v("a", "X"), v("b", "Y"), v("c", "Y"), v("d", "Z")];
    expect(topChannels(list).map((c) => c.name)).toEqual(["Y", "X", "Z"]);
    expect(topChannels(list, 1).map((c) => c.name)).toEqual(["Y"]);
  });
});
