import { afterEach, describe, expect, it, vi } from "vitest";
import { cmsValue, readCms, resolveCms, type CmsPage } from "./cms";

const page: CmsPage = {
  app: "hub",
  page: "home",
  label: "หน้าแรก",
  sections: [
    {
      key: "hero",
      label: "Hero",
      movable: false,
      fields: { line1: { kind: "text", label: "", default: "สวัสดี" } },
    },
    {
      key: "status",
      label: "Status",
      fields: { rounds: { kind: "number", label: "", default: 7 } },
    },
    { key: "faq", label: "FAQ" },
  ],
};

describe("resolveCms", () => {
  it("falls back to defaults with no rows", () => {
    const c = resolveCms(page, []);
    expect(c.text("hero.line1")).toBe("สวัสดี");
    expect(c.number("status.rounds")).toBe(7);
    expect(c.sections()).toEqual([
      { key: "hero", visible: true },
      { key: "status", visible: true },
      { key: "faq", visible: true },
    ]);
  });

  it("applies overrides, order and visibility", () => {
    const c = resolveCms(page, [
      { key: "hero.line1", kind: "text", value: { text: "ใหม่" } },
      { key: "status.rounds", kind: "number", value: { n: 8 } },
      { key: "faq", kind: "section", value: { visible: false, order: 0 } },
      { key: "hero", kind: "section", value: { visible: false, order: 9 } },
    ]);
    expect(c.text("hero.line1")).toBe("ใหม่");
    expect(c.number("status.rounds")).toBe(8);
    // the hero is not movable, so its row is ignored
    expect(c.sections()).toEqual([
      { key: "hero", visible: true },
      { key: "faq", visible: false },
      { key: "status", visible: true },
    ]);
  });

  it("ignores malformed or mistyped rows", () => {
    const c = resolveCms(page, [
      { key: "hero.line1", kind: "number", value: { n: 1 } },
      { key: "status.rounds", kind: "number", value: { n: "8" } },
    ]);
    expect(c.text("hero.line1")).toBe("สวัสดี");
    expect(c.number("status.rounds")).toBe(7);
  });

  it("refuses fields it does not declare", () => {
    expect(() => resolveCms(page, []).text("hero.nope")).toThrow();
    expect(() => resolveCms(page, []).text("status.rounds")).toThrow();
  });
});

describe("cmsValue", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.example",
    "/\\evil",
    "http://x.test",
  ])("refuses link %s", (href) => {
    expect(cmsValue.link.safeParse({ label: "x", href }).success).toBe(false);
  });
  it.each(["https://x.test", "mailto:a@b.test", "#contact", "/", "/go/canva"])(
    "allows link %s",
    (href) => {
      expect(cmsValue.link.safeParse({ label: "x", href }).success).toBe(true);
    },
  );
  it("allows only https or same-site images", () => {
    expect(cmsValue.image.safeParse({ url: "mailto:x", alt: "" }).success).toBe(false);
    expect(cmsValue.image.safeParse({ url: "/a.webp", alt: "" }).success).toBe(true);
  });
});

describe("readCms", () => {
  afterEach(() => vi.unstubAllGlobals());
  const env = { url: "http://db.test", publishableKey: "k" };

  it("returns [] when the database is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(readCms(env, "hub", "home")).resolves.toEqual([]);
  });

  it("asks the cms schema for one page", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json([{ key: "a", kind: "text", value: { text: "x" } }]));
    vi.stubGlobal("fetch", fetch);
    await expect(readCms(env, "hub", "home")).resolves.toHaveLength(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("app=eq.hub");
    expect(url).toContain("page=eq.home");
    expect(init.headers).toMatchObject({ "Accept-Profile": "cms", apikey: "k" });
  });
});

describe("image urls", () => {
  it.each([
    "https://x.test/a.png",
    "http://127.0.0.1:54321/a.png",
    "http://localhost/a.png",
    "/a.webp",
  ])("allows %s", (url) => expect(cmsValue.image.safeParse({ url, alt: "" }).success).toBe(true));
  it.each([
    "http://evil.test/a.png",
    "/",
    "//evil.test/a.png",
    "javascript:x",
    "http://localhost.evil.test/a",
  ])("refuses %s", (url) => expect(cmsValue.image.safeParse({ url, alt: "" }).success).toBe(false));
});
