import { afterEach, describe, expect, it, vi } from "vitest";
import { resumeAt } from "../components/player";
import { fetchOembed, youtubeId } from "./youtube";

describe("youtubeId", () => {
  it.each([
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=x", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  https://www.youtube.com/live/dQw4w9WgXcQ  ", "dQw4w9WgXcQ"],
  ])("reads %s", (input, id) => {
    expect(youtubeId(input)).toBe(id);
  });

  it.each([
    "",
    "hello",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)//youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/channel/UC1234567890",
  ])("refuses %s", (input) => {
    expect(youtubeId(input)).toBeNull();
  });
});

describe("fetchOembed", () => {
  afterEach(() => vi.unstubAllGlobals());
  const answer = (body: unknown, ok = true) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok, json: async () => body })),
    );

  it("keeps only the title and channel, cut to size", async () => {
    answer({ title: "x".repeat(300), author_name: "ช่อง", html: "<iframe>" });
    expect(await fetchOembed("dQw4w9WgXcQ")).toEqual({ title: "x".repeat(200), author: "ช่อง" });
  });

  it("gives up on a private video or a strange answer", async () => {
    answer({}, false);
    expect(await fetchOembed("dQw4w9WgXcQ")).toBeNull();
    answer({ title: 42 });
    expect(await fetchOembed("dQw4w9WgXcQ")).toBeNull();
  });
});

describe("resumeAt", () => {
  it.each([
    [3, 600, 0], // barely started
    [120.7, 600, 120],
    [590, 600, 0], // the credits: start over next time
    [30, 0, 0], // live or unknown length
  ])("%s s of %s s → %s", (seconds, duration, at) => {
    expect(resumeAt(seconds, duration)).toBe(at);
  });
});
