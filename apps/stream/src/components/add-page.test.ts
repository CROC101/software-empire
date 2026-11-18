import { describe, expect, it } from "vitest";
import { guessKind } from "./add-page";

describe("guessKind", () => {
  it("reads the shelf from where the link was copied", () => {
    expect(guessKind("https://www.youtube.com/shorts/abcdefghijk")).toBe("short");
    expect(guessKind("youtube.com/shorts/abcdefghijk")).toBe("short");
    expect(guessKind("https://music.youtube.com/watch?v=abcdefghijk")).toBe("music");
    expect(guessKind("https://youtu.be/abcdefghijk")).toBe("video");
  });

  it("ignores YouTube names placed anywhere but the host", () => {
    expect(guessKind("https://evil.example/youtube.com/shorts/abcdefghijk")).toBe("video");
    expect(guessKind("https://evil.example/?u=music.youtube.com")).toBe("video");
    expect(guessKind("https://music.youtube.com.evil.example/x")).toBe("video");
    expect(guessKind("not a link")).toBe("video");
  });
});
