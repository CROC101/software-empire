import { describe, expect, it } from "vitest";
import { withSession } from "./launch-gate-worker";

describe("withSession", () => {
  it("passes the hub's refreshed session cookies on to the browser", async () => {
    const gate = new Response(null, { status: 204 });
    gate.headers.append("set-cookie", "sb-x-auth-token=NEW; Path=/; Domain=.example.com");
    gate.headers.append("set-cookie", "sb-x-auth-token.1=; Path=/; Max-Age=0");
    const out = withSession(
      gate,
      new Response("<html>", { headers: { "content-type": "text/html" } }),
    );

    expect(out.headers.getSetCookie()).toHaveLength(2);
    expect(out.headers.get("cache-control")).toBe("private, no-store");
    expect(out.headers.get("content-type")).toBe("text/html");
    expect(await out.text()).toBe("<html>");
  });

  it("leaves the response alone when the session did not change", () => {
    const page = new Response("ok");
    expect(withSession(new Response(null, { status: 204 }), page)).toBe(page);
  });
});
