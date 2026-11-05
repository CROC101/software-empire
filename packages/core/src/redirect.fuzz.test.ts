import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { safeRedirectPath, safeRedirectTarget } from "./redirect";

const ALLOWED = ["https://app.example.com"];

/** Fuzz: whatever an attacker puts in `?next=`, the result stays on an allowed origin. */
describe("redirect fuzz", () => {
  it("safeRedirectPath never leaves the site", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webUrl(), fc.anything()), (input) => {
        const out = safeRedirectPath(input);
        const url = new URL(out, "https://hub.example.com");
        expect(url.origin).toBe("https://hub.example.com");
      }),
      { numRuns: 2000 },
    );
  });

  it("safeRedirectTarget only returns paths or allowed origins", () => {
    const tricky = fc.constantFrom(
      "//evil.com",
      "/\\evil.com",
      "https://app.example.com@evil.com",
      "https://app.example.com.evil.com/",
      "javascript:alert(1)",
      "https://evil.com/https://app.example.com",
    );
    fc.assert(
      fc.property(fc.oneof(tricky, fc.string(), fc.webUrl()), (input) => {
        const out = safeRedirectTarget(input, ALLOWED);
        const url = new URL(out, "https://hub.example.com");
        expect(["https://hub.example.com", ...ALLOWED]).toContain(url.origin);
      }),
      { numRuns: 2000 },
    );
  });
});
