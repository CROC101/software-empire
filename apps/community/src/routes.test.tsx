import { describe, expect, it } from "vitest";

describe("routes", () => {
  // every leaf resolves its lazy page module while the table is built — a glob that matches
  // nothing throws here instead of shipping a blank screen
  // importing every page module takes ~4s alone and longer while the whole repo verifies at once
  it("finds a page module for every route", { timeout: 30_000 }, async () => {
    const { router } = await import("./routes");
    expect(router.routes.length).toBeGreaterThan(0);
  });
});
