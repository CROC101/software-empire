import { describe, expect, it } from "vitest";
import { searchQuery, searchUrl, shuffle, toPage } from "./search";

const ask = (q: Record<string, string>) => searchQuery.parse(q);

describe("searchUrl", () => {
  it("asks only for embeddable, strict-safe videos, shaped by mode", () => {
    const url = searchUrl(ask({ q: "lofi", kind: "music" }), "KEY");
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/search");
    expect(url.searchParams.get("safeSearch")).toBe("strict");
    expect(url.searchParams.get("videoEmbeddable")).toBe("true");
    expect(url.searchParams.get("type")).toBe("video");
    expect(url.searchParams.get("maxResults")).toBe("50");
    expect(url.searchParams.get("order")).toBe("relevance");
    expect(url.searchParams.get("videoCategoryId")).toBe("10");
    expect(url.searchParams.has("publishedAfter")).toBe(false);
    expect(url.searchParams.has("pageToken")).toBe(false);
    expect(searchUrl(ask({ q: "cat", kind: "movie" }), "K").searchParams.get("videoDuration")).toBe(
      "long",
    );
    const short = searchUrl(ask({ q: "cat", kind: "short" }), "K").searchParams;
    expect(short.get("videoDuration")).toBe("short");
    expect(short.get("q")).toBe("cat #shorts");
  });

  it("passes YouTube's filters: sort, upload date, length and the next page", () => {
    const now = Date.parse("2026-11-18T12:00:00Z");
    const url = searchUrl(
      ask({ q: "cat", order: "viewCount", when: "week", length: "medium", page: "CDIQAA" }),
      "K",
      now,
    ).searchParams;
    expect(url.get("order")).toBe("viewCount");
    expect(url.get("publishedAfter")).toBe("2026-11-11T12:00:00.000Z");
    expect(url.get("videoDuration")).toBe("medium");
    expect(url.get("pageToken")).toBe("CDIQAA");
  });

  it("keeps movies long and shorts short whatever the length filter says", () => {
    const movie = ask({ q: "cat", kind: "movie", length: "short" });
    expect(searchUrl(movie, "K").searchParams.get("videoDuration")).toBe("long");
  });
});

describe("searchQuery", () => {
  it("trims, caps length and falls back to defaults for unknown values", () => {
    expect(ask({ q: "  hi ", kind: "nope", order: "x", when: "y", length: "z" })).toEqual({
      q: "hi",
      kind: "video",
      order: "relevance",
      when: "any",
      length: "any",
      page: undefined,
    });
    expect(searchQuery.safeParse({ q: "   " }).success).toBe(false);
    expect(searchQuery.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });

  it("drops page tokens that are not plain tokens", () => {
    expect(ask({ q: "a", page: "../x?y=1" }).page).toBeUndefined();
  });
});

describe("toPage", () => {
  const snippet = {
    title: "Tom &amp; Jerry &quot;live&quot; &#39;s &lt;3",
    channelTitle: "A&amp;B",
    publishedAt: "2026-01-01T00:00:00Z",
  };

  it("turns YouTube's escaped titles back to text, keeps the mode and the next page", () => {
    expect(
      toPage(
        { nextPageToken: "NEXT", items: [{ id: { videoId: "abcdefghijk" }, snippet }] },
        "movie",
      ),
    ).toEqual({
      hits: [
        {
          youtube_id: "abcdefghijk",
          kind: "movie",
          title: `Tom & Jerry "live" 's <3`,
          author: "A&B",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      next: "NEXT",
    });
  });

  it("drops results without a video id and rejects ids that are not YouTube ids", () => {
    expect(toPage({ items: [{ id: {}, snippet }] }, "video")).toEqual({ hits: [], next: null });
    expect(() =>
      toPage({ items: [{ id: { videoId: "../../evil" }, snippet }] }, "video"),
    ).toThrow();
  });
});

describe("shuffle", () => {
  it("keeps every item and leaves the input alone", () => {
    const list = [1, 2, 3, 4, 5];
    const out = shuffle(list, () => 0);
    expect(out).toEqual([2, 3, 4, 5, 1]);
    expect(list).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffle(list)].sort()).toEqual(list);
  });
});
