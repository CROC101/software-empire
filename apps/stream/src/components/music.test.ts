import { describe, expect, it } from "vitest";
import { type Video } from "@/lib/api";
import { byChannel } from "./music";

const v = (youtube_id: string, author: string): Video => ({
  youtube_id,
  author,
  kind: "music",
  title: youtube_id,
  created_at: "2026-01-01T00:00:00Z",
});

describe("byChannel", () => {
  it("groups tracks by channel in first-seen order and keeps track order", () => {
    const list = [v("a", "X"), v("b", "Y"), v("c", "X")];
    expect(byChannel(list)).toEqual([
      { name: "X", tracks: [list[0], list[2]] },
      { name: "Y", tracks: [list[1]] },
    ]);
    expect(byChannel([])).toEqual([]);
  });
});
