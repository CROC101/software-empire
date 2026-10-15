import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Preference, TemplateSummary } from "@/lib/types";

// routes below never reach Supabase; the client module would otherwise parse VITE_* env on import
vi.mock("@/lib/supabase", () => ({
  supabase: {},
  ASSET_BUCKET: "canva-assets",
  assetContentUrl: (id: string) => `https://storage.test/${id}`,
}));

const { api, ApiError, qs } = await import("./api");

beforeEach(() => {
  localStorage.clear();
});

describe("qs", () => {
  it("drops empty and undefined values", () => {
    expect(qs({ q: "", page: 2, starred: true, folderId: undefined })).toBe("?page=2&starred=true");
    expect(qs({ q: undefined })).toBe("");
  });
});

describe("api routing", () => {
  it("answers 501 for csmju-canvas features that are not ported", async () => {
    await expect(api.get("/designs/abc/stats")).rejects.toMatchObject({
      status: 501,
      code: "NOT_AVAILABLE",
    });
    await expect(api.post("/brand-kits", {})).rejects.toBeInstanceOf(ApiError);
    await expect(api.upload("/brand-kits", new File(["x"], "x.png"))).rejects.toMatchObject({
      status: 501,
    });
  });

  it("lists built-in templates with search, filters and paging", async () => {
    const all = await api.list<TemplateSummary>("/templates?limit=100");
    expect(all.items.length).toBeGreaterThan(0);
    expect(all.items.every((t) => t.isBuiltIn && !t.isMine)).toBe(true);
    expect(all.meta.total).toBe(all.items.length);

    const first = all.items[0];
    const byType = await api.list<TemplateSummary>(
      `/templates${qs({ designType: first.designType, limit: 100 })}`,
    );
    expect(byType.items.every((t) => t.designType === first.designType)).toBe(true);

    const page = await api.list<TemplateSummary>("/templates?limit=1&page=2");
    expect(page.items).toHaveLength(Math.min(1, Math.max(0, all.items.length - 1)));

    expect((await api.list("/templates?owner=mine")).items).toEqual([]);
  });

  it("stars and unstars templates in this browser", async () => {
    const [template] = (await api.list<TemplateSummary>("/templates")).items;
    await api.post("/template-favorites", { templateId: template.id });
    expect(
      (await api.list<TemplateSummary>("/templates?starred=true")).items.map((t) => t.id),
    ).toEqual([template.id]);

    await api.del(`/template-favorites/${template.id}`);
    expect((await api.list("/templates?starred=true")).items).toEqual([]);
  });

  it("404s an unknown template", async () => {
    await expect(api.get("/templates/nope")).rejects.toMatchObject({ status: 404 });
  });

  it("keeps preferences in localStorage", async () => {
    expect((await api.get<Preference>("/preferences")).theme).toBe("SYSTEM");
    await api.patch("/preferences", { theme: "DARK", largeText: true });
    const saved = await api.get<Preference>("/preferences");
    expect(saved).toMatchObject({ theme: "DARK", largeText: true, highContrast: false });
  });
});
