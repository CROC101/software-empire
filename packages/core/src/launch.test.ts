import { describe, expect, it } from "vitest";
import { LAUNCH_AT, fallbackAnswer, gateAnswer, gateTarget, launched } from "./launch";
import worker from "./launch-gate-worker";

const assets = { fetch: () => Promise.resolve(new Response("app")) };
const asked: string[] = [];
const hub = (status: number) => ({
  fetch: (input: Request | string) => {
    asked.push(typeof input === "string" ? input : input.url);
    return Promise.resolve(
      status === 204
        ? new Response(null, { status })
        : Response.json({ location: "https://hub.example/closed?app=canva" }, { status }),
    );
  },
});
const open = (accept = "text/html") =>
  new Request("https://app.example/feed", { headers: { accept, cookie: "sb=1" } });

describe("launch gate", () => {
  it("falls back to midnight Thai time on 1 Jan 2570", () => {
    expect(new Date(LAUNCH_AT).toISOString()).toBe("2026-12-31T17:00:00.000Z");
    expect(launched(LAUNCH_AT - 1)).toBe(false);
    expect(fallbackAnswer(LAUNCH_AT - 1).verdict).toBe("soon");
    expect(fallbackAnswer(LAUNCH_AT).verdict).toBe("open");
  });

  it("sends each verdict to the right hub page", () => {
    const hubUrl = "https://hub.example/";
    const next = "https://canva.example/design/1?x=1";
    expect(gateTarget("open", hubUrl, "canva", next)).toBeNull();
    expect(gateTarget("soon", hubUrl, "canva", next)).toBe("https://hub.example/");
    expect(gateTarget("closed", hubUrl, "canva", next)).toBe(
      "https://hub.example/closed?app=canva",
    );
    expect(gateTarget("login", hubUrl, "canva", next)).toBe(
      `https://hub.example/login?next=${encodeURIComponent(next)}`,
    );
    expect(gateTarget("mfa", hubUrl, "canva", next)).toMatch(/^https:\/\/hub\.example\/mfa\?next=/);
  });

  it("refuses a malformed answer from the database", () => {
    expect(gateAnswer.safeParse({ verdict: "maybe", message: "", status: "open" }).success).toBe(
      false,
    );
  });

  it("asks the hub about its own app on every page open", async () => {
    asked.length = 0;
    const shut = await worker.fetch(open(), { ASSETS: assets, HUB: hub(403), APP: "canva" });
    expect(shut.status).toBe(302);
    expect(shut.headers.get("location")).toBe("https://hub.example/closed?app=canva");
    const url = new URL(asked[0] ?? "");
    expect(url.searchParams.get("app")).toBe("canva");
    expect(url.searchParams.get("next")).toBe("https://app.example/feed");
    const ok = await worker.fetch(open(), { ASSETS: assets, HUB: hub(204), APP: "canva" });
    expect(await ok.text()).toBe("app");
  });

  it("never checks scripts or styles", async () => {
    const res = await worker.fetch(open("*/*"), { ASSETS: assets, HUB: hub(403) });
    expect(await res.text()).toBe("app");
  });
});
