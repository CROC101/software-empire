import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// the playground previews /p/<slug> in a same-origin iframe; DENY / 'none' broke it in production only
const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf8");

describe("_headers", () => {
  it("lets this site frame itself and nobody else", () => {
    expect(headers).toContain("frame-ancestors 'self'");
    expect(headers).toContain("X-Frame-Options: SAMEORIGIN");
    expect(headers).not.toMatch(/frame-ancestors 'none'|X-Frame-Options: DENY/);
  });
});
