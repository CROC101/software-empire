import { describe, expect, it } from "vitest";
import { searchQuery, searchUrl, toHits } from "./search";

describe("searchUrl", () => {
  it("asks only for embeddable, strict-safe videos, shaped by mode", () => {
    const url = searchUrl("lofi", "music", "KEY");
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/search");
    expect(url.searchParams.get("safeSearch")).toBe("strict");
    expect(url.searchParams.get("videoEmbeddable")).toBe("true");
    expect(url.searchParams.get("type")).toBe("video");
    expect(url.searchParams.get("videoCategoryId")).toBe("10");
    expect(searchUrl("cat", "movie", "K").searchParams.get("videoDuration")).toBe("long");
    const short = searchUrl("cat", "short", "K").searchParams;
    expect(short.get("videoDuration")).toBe("short");
    expect(short.get("q")).toBe("cat #shorts");
  });
});

describe("searchQuery", () => {
  it("trims, caps length and falls back to video for unknown modes", () => {
    expect(searchQuery.parse({ q: "  hi ", kind: "nope" })).toEqual({ q: "hi", kind: "video" });
    expect(searchQuery.safeParse({ q: "   " }).success).toBe(false);
    expect(searchQuery.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });
});

describe("toHits", () => {
  const snippet = {
    title: "Tom &amp; Jerry &quot;live&quot; &#39;s &lt;3",
    channelTitle: "A&amp;B",
    publishedAt: "2026-01-01T00:00:00Z",
  };

  it("turns YouTube's escaped titles back to text and keeps the mode", () => {
    expect(toHits({ items: [{ id: { videoId: "abcdefghijk" }, snippet }] }, "movie")).toEqual([
      {
        youtube_id: "abcdefghijk",
        kind: "movie",
        title: `Tom & Jerry "live" 's <3`,
        author: "A&B",
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);
  });

  it("drops results without a video id and rejects ids that are not YouTube ids", () => {
    expect(toHits({ items: [{ id: {}, snippet }] }, "video")).toEqual([]);
    expect(() =>
      toHits({ items: [{ id: { videoId: "../../evil" }, snippet }] }, "video"),
    ).toThrow();
  });
});
