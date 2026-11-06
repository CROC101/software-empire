// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAsk } from "./ask";

const env = {
  SUPABASE_URL: "https://db.test",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test",
  GEMINI_API_KEY: "g-test",
};
const USER = "11111111-1111-1111-1111-111111111111";

const ask = (body: unknown, token: string | null = "user-token") =>
  new Request("https://tarot.test/api/ask", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}`, "content-type": "application/json" } : {},
    body: JSON.stringify(body),
  });

/** Fakes Supabase (auth, tarot tables, RPCs) and Gemini; records every RPC call. */
function fakeBackend({ balance = 50, cost = 0 } = {}) {
  const rpcs: { fn: string; args: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
      if (url.endsWith("/auth/v1/user")) return reply({ id: USER });
      if (url.includes("/rest/v1/rpc/")) {
        const fn = url.split("/rpc/")[1] ?? "";
        rpcs.push({ fn, args: JSON.parse(init?.body as string) as Record<string, unknown> });
        if (fn === "ask_quote") return reply([{ cost, balance }]);
        if (fn === "ask_record") return reply([{ chat_id: "c-1", cost, balance: balance - cost }]);
      }
      if (url.includes("/rest/v1/")) return reply([]);
      if (url.includes("generativelanguage.googleapis.com"))
        return reply({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ answer: "สวัสดีจ้า", remember: ["ชอบแมว"] }) }],
              },
            },
          ],
        });
      throw new Error(`unexpected fetch ${url}`);
    }),
  );
  return rpcs;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/ask", () => {
  it("needs a signed-in reader", async () => {
    fakeBackend();
    const res = await handleAsk(ask({ chatId: null, mode: "chat", question: "hi" }, null), env);
    expect(res.status).toBe(401);
  });

  it("refuses before calling any AI when coins are short", async () => {
    const rpcs = fakeBackend({ balance: 5, cost: 20 });
    const res = await handleAsk(ask({ chatId: null, mode: "reading", question: "งานดีไหม" }), env);
    expect(res.status).toBe(402);
    expect(rpcs.map((r) => r.fn)).toEqual(["ask_quote"]);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([u]) => typeof u === "string" && u.includes("generativelanguage")),
    ).toBe(false);
  });

  it("answers casual chat with Gemini and records it once", async () => {
    const rpcs = fakeBackend();
    const res = await handleAsk(ask({ chatId: null, mode: "chat", question: "เหนื่อยจัง" }), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ chatId: "c-1", answer: "สวัสดีจ้า", cards: [] });
    const record = rpcs.find((r) => r.fn === "ask_record");
    expect(record?.args).toMatchObject({
      who: USER,
      mode: "chat",
      engine: "gemini",
      notes: ["ชอบแมว"],
      cards: null,
    });
  });

  it("draws the cards itself for a reading and stores them with the answer", async () => {
    const rpcs = fakeBackend({ balance: 50, cost: 20 });
    const res = await handleAsk(
      ask({ chatId: null, mode: "reading", question: "ความรักเป็นยังไง" }),
      env,
    );
    expect(res.status).toBe(200);
    const record = rpcs.find((r) => r.fn === "ask_record");
    // default length is medium: two cards
    expect(record?.args.cards).toHaveLength(2);
  });

  it("rejects a malformed request", async () => {
    fakeBackend();
    const res = await handleAsk(ask({ mode: "chat", question: "" }), env);
    expect(res.status).toBe(400);
  });
});
