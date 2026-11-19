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

  // the clone templates run third-party-shaped code: an opaque origin keeps our cookies out of reach
  it("sandboxes /tpl/* without same-origin", () => {
    const block = headers.split(/\r?\n(?=\S)/).find((b) => b.startsWith("/tpl/*"));
    expect(block).toMatch(/Content-Security-Policy: sandbox allow-scripts/);
    expect(block).not.toContain("allow-same-origin");
  });
});
