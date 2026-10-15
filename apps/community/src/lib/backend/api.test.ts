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
    await expect(api.list("/realtime-tickets")).rejects.toMatchObject({
      status: 501,
      code: "NOT_AVAILABLE",
    });
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

  it("rejects malformed room and message ids before touching the database", async () => {
    await expect(api.get("/channels/not-a-room")).rejects.toMatchObject({ status: 404 });
    await expect(api.patch("/channels/abc/messages/xyz", { content: "a" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      api.post("/channels/11111111-1111-4111-8111-111111111111/messages", { content: "hi" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("validates new rooms and reactions locally", async () => {
    await expect(api.post("/channels", { kind: "GROUP", name: "  " })).rejects.toMatchObject({
      status: 400,
    });
    await expect(api.post("/direct-channels", {})).rejects.toMatchObject({ status: 400 });
    await expect(
      api.post("/reactions", { targetKind: "STORY", targetId: ME, emoji: "👍" }),
    ).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      api.post("/reactions", { targetKind: "REEL", targetId: "reel-1", emoji: "👍" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.post("/reactions", { targetKind: "POST", targetId: "post-1", emoji: "👍" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects malformed feed, upload and bookmark input before touching the database", async () => {
    await expect(api.get("/posts/post-1")).rejects.toMatchObject({ status: 404 });
    await expect(api.del("/posts/p1/comments/c1")).rejects.toMatchObject({ status: 404 });
    await expect(api.post("/posts", { content: "hi", assetIds: ["nope"] })).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.post("/assets/abc/commit")).rejects.toMatchObject({ status: 404 });
    await expect(api.get("/assets/abc/download-url")).rejects.toMatchObject({ status: 404 });
    await expect(api.list("/bookmarks?targetKind=STORY")).rejects.toMatchObject({ status: 400 });
    await expect(
      api.post("/bookmarks", { targetKind: "POST", targetId: "x" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(api.del("/bookmark-collections/c1/items?targetKind=POST")).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      api.post("/channels/11111111-1111-4111-8111-111111111111/messages", {
        clientNonce: "n1",
        assetIds: ["../etc"],
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects malformed reel, story, highlight, note and share input before touching the database", async () => {
    await expect(api.get("/reels/r9")).rejects.toMatchObject({ status: 404 });
    await expect(api.post("/reels/r1/likes")).rejects.toMatchObject({ status: 404 });
    await expect(api.del("/reels/r1/reposts")).rejects.toMatchObject({ status: 404 });
    await expect(api.list(`/reels/${ME}/comments?parentId=c1`)).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.list("/reels?authorCoreUserId=user-003")).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.post("/reels", { title: "x", assetId: "nope" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.post("/stories/s1/views")).rejects.toMatchObject({ status: 404 });
    await expect(api.post(`/stories/${ME}/replies`, {})).rejects.toMatchObject({ status: 400 });
    await expect(
      api.post(`/stories/${ME}/replies`, { content: "hi", emoji: "🔥" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(api.post("/highlights", { title: "t", storyIds: ["s1"] })).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.del("/highlights/h1")).rejects.toMatchObject({ status: 404 });
    await expect(api.get("/profiles/x/highlights")).rejects.toMatchObject({ status: 404 });
    await expect(api.post("/shares", { targetKind: "NOTE", targetId: ME })).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      api.post("/shares", { targetKind: "REEL", targetId: ME, channelIds: ["../x"] }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(api.post("/shares", { targetKind: "REEL", targetId: ME })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects malformed notification, search and activity input before touching the database", async () => {
    await expect(api.patch("/notifications/n1/read")).rejects.toMatchObject({ status: 404 });
    await expect(api.list("/notifications?kind=LIKE")).rejects.toMatchObject({ status: 400 });
    await expect(
      api.patch("/me/notification-preferences", { likes: "SOMETIMES" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.patch("/me/notification-preferences", { pauseMinutes: 30 }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(api.get("/search?q=a")).rejects.toMatchObject({ status: 400 });
    await expect(api.get("/search?q=hello&kind=files")).rejects.toMatchObject({ status: 400 });
    await expect(api.list("/activity/likes?target=STORY")).rejects.toMatchObject({ status: 400 });
    await expect(api.list("/activity/comments?from=2026-02-31")).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      api.list("/activity/comments?from=2026-03-02&to=2026-03-01"),
    ).rejects.toMatchObject({ status: 400 });
    await expect(api.list("/activity/media?kind=STORY")).rejects.toMatchObject({ status: 400 });
    await expect(api.list("/activity/account-history?order=random")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("cuts search snippets around the match", async () => {
    const { snippet } = await import("./notify-api");
    expect(snippet(null, "x")).toBeNull();
    expect(snippet("short text", "zzz")).toBe("short text");
    const long = `${"a".repeat(100)}needle${"b".repeat(300)}`;
    const cut = snippet(long, "NEEDLE") ?? "";
    expect(cut.startsWith("…")).toBe(true);
    expect(cut.endsWith("…")).toBe(true);
    expect(cut).toContain("needle");
  });

  it("rejects malformed meeting, voice, report and admin input before touching the database", async () => {
    await expect(api.get("/meetings/m1")).rejects.toMatchObject({ status: 404 });
    await expect(
      api.post("/meetings", { channelId: ME, title: "x", startsAt: "tomorrow", endsAt: "later" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(api.post("/voice-sessions", { channelId: "room-1" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.patch("/voice-sessions/s1/participants/me", {})).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      api.post("/calls/feedback", { channelId: ME, rating: 9, kind: "AUDIO" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(api.post("/reports", { targetKind: "NOTE", targetId: "x" })).rejects.toMatchObject(
      {
        status: 400,
      },
    );
    await expect(api.list("/reports?status=DONE")).rejects.toMatchObject({ status: 400 });
    await expect(api.patch(`/reports/${ME}`, { status: "OPEN" })).rejects.toMatchObject({
      status: 400,
    });
    await expect(api.list("/subsystem-members?layer2Role=OWNER")).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      api.patch("/subsystem-members/someone/role", { layer2Role: "ADMIN" }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.patch(`/subsystem-members/${ME}/storage-quota`, { storageQuotaBytes: 1.5 }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.list("/audit-logs?since=2026-03-02T00:00:00Z&until=2026-03-01T00:00:00Z"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("builds query strings without empty values", () => {
    expect(qs({ limit: 20, q: "", page: undefined })).toBe("?limit=20");
  });
});
