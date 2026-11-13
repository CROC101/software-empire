import { describe, expect, it } from "vitest";
import { langCookie, readLang } from "./lang";

describe("shared language cookie", () => {
  it("reads English only when chosen, Thai otherwise", () => {
    expect(readLang("a=1; em-lang=en; b=2")).toBe("en");
    expect(readLang("em-lang=th")).toBe("th");
    expect(readLang("xem-lang=en")).toBe("th");
    expect(readLang("em-lang=english")).toBe("th");
    expect(readLang("")).toBe("th");
  });

  it("scopes the cookie to the parent domain only when one is configured", () => {
    expect(langCookie("en")).toMatch(/^em-lang=en; Path=\/; Max-Age=\d+; SameSite=Lax$/);
    expect(langCookie("en", ".crocwork.studio")).toContain("Domain=.crocwork.studio");
  });
});
