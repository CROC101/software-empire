import { describe, expect, it, vi } from "vitest";

const ME = "11111111-1111-4111-8111-111111111111";

// only the guards in front of the database are exercised here; RLS itself is covered by pgTAP
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: ME } } } }) },
  },
  db: () => {
    throw new Error("database must not be reached by these tests");
  },
}));

const { api, qs } = await import("./api");

describe("api router", () => {
  it("answers 501 for csmju-nexus areas that are not ported yet", async () => {
    await expect(api.list("/reels")).rejects.toMatchObject({ status: 501, code: "NOT_AVAILABLE" });
    await expect(api.post("/channels", {})).rejects.toMatchObject({ status: 501 });
  });

  it("treats anything that is not a user id as a missing user", async () => {
    await expect(api.get("/profiles/6700001382-somsak")).rejects.toMatchObject({ status: 404 });
    await expect(api.del("/blocks/..%2Fprofiles")).rejects.toMatchObject({ status: 404 });
  });

  it("refuses to follow yourself before touching the database", async () => {
    await expect(api.post("/follows", { coreUserId: ME })).rejects.toMatchObject({ status: 400 });
  });

  it("resolves no profiles for an empty or invalid id list", async () => {
    await expect(api.get("/profiles?coreUserIds=not-a-uuid,,")).resolves.toEqual([]);
  });

  it("builds query strings without empty values", () => {
    expect(qs({ limit: 20, q: "", page: undefined })).toBe("?limit=20");
  });
});
