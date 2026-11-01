import { describe, expect, it } from "vitest";
import { LAUNCH_AT, launched } from "./launch";
import worker from "./launch-gate-worker";

const assets = { fetch: () => Promise.resolve(new Response("app")) };
const hub = (status: number) => ({
  fetch: () =>
    Promise.resolve(
      status === 204
        ? new Response(null, { status })
        : Response.json({ hub: "https://hub.example" }, { status }),
    ),
});
const open = (accept = "text/html") =>
  new Request("https://app.example/feed", { headers: { accept, cookie: "sb=1" } });

describe("launch gate", () => {
  it("opens at midnight Thai time on 1 Jan 2570", () => {
    expect(new Date(LAUNCH_AT).toISOString()).toBe("2026-12-31T17:00:00.000Z");
    expect(launched(LAUNCH_AT - 1)).toBe(false);
    expect(launched(LAUNCH_AT)).toBe(true);
  });

  it("sends a page open to the countdown unless the hub says admin", async () => {
    if (launched()) return; // after launch the worker lets everything through
    const shut = await worker.fetch(open(), { ASSETS: assets, HUB: hub(403) });
    expect(shut.status).toBe(302);
    expect(shut.headers.get("location")).toBe("https://hub.example");
    const admin = await worker.fetch(open(), { ASSETS: assets, HUB: hub(204) });
    expect(await admin.text()).toBe("app");
  });

  it("never checks scripts or styles", async () => {
    const res = await worker.fetch(open("*/*"), { ASSETS: assets, HUB: hub(403) });
    expect(await res.text()).toBe("app");
  });
});
