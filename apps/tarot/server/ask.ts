/**
 * POST /api/ask on the crocwork-tarot Worker: one message to the owl. Checks who is asking
 * (Supabase, from the bearer token), quotes the price, draws the cards for a reading, asks the
 * AI, then records both messages and charges in one database call (tarot.ask_record).
 * Readings go to Claude (Gemini if Claude fails); casual chat goes to the cheapest Gemini model
 * (Claude if Gemini fails). Keys are Cloudflare secrets: ANTHROPIC_API_KEY, GEMINI_API_KEY.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  askRequest,
  LENGTHS,
  owlReply,
  systemPrompt,
  userTurn,
  type AskContext,
  type Length,
  type OwlReply,
  type Tone,
} from "../src/lib/ask";
import { draw, type Drawn } from "../src/lib/reading";
import { signOf } from "../src/lib/zodiac";

export type AskEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
};

const CLAUDE_MODEL = "claude-haiku-5-5";
// the cheapest Gemini, for casual chat; override with the GEMINI_MODEL variable
const GEMINI_DEFAULT = "gemini-2.5-flash-lite";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

type Turn = { role: "user" | "assistant"; text: string };

export async function handleAsk(request: Request, env: AskEnv): Promise<Response> {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = env;
  if (!url || !key) return json({ error: "not_configured" }, 503);
  if (!env.ANTHROPIC_API_KEY && !env.GEMINI_API_KEY) return json({ error: "no_ai" }, 503);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "sign_in" }, 401);
  const parsed = askRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { chatId, mode, question } = parsed.data;

  const db = supabase(url, key);
  const user = await db.user(token);
  if (!user) return json({ error: "sign_in" }, 401);

  const settings = (
    await db.get<{
      tone: Tone;
      length: Length;
      remember_profile: boolean;
      remember_notes: boolean;
    }>(`chat_settings?user_id=eq.${user}&select=tone,length,remember_profile,remember_notes`)
  )[0] ?? {
    tone: "casual" as Tone,
    length: "medium" as Length,
    remember_profile: true,
    remember_notes: true,
  };

  const [quote] = await db.rpc<{ cost: number; balance: number }[]>("ask_quote", {
    who: user,
    mode,
    length: settings.length,
  });
  if (!quote) return json({ error: "server" }, 500);
  if (quote.balance < quote.cost)
    return json({ error: "coins", cost: quote.cost, balance: quote.balance }, 402);

  const profile = settings.remember_profile
    ? (
        await db.get<{ nickname: string; birth_date: string | null }>(
          `profiles?user_id=eq.${user}&select=nickname,birth_date`,
        )
      )[0]
    : undefined;
  const memories = settings.remember_notes
    ? (
        await db.get<{ note: string }>(
          `memories?user_id=eq.${user}&select=note&order=created_at.desc&limit=20`,
        )
      ).map((m) => m.note)
    : [];
  const history: Turn[] = chatId
    ? (
        await db.get<{ role: "user" | "owl"; body: string }>(
          `chat_messages?chat_id=eq.${chatId}&user_id=eq.${user}&select=role,body&order=id.desc&limit=12`,
        )
      )
        .reverse()
        .map((m) => ({
          role: m.role === "owl" ? "assistant" : "user",
          text: m.role === "user" ? userTurn(m.body) : m.body,
        }))
    : [];

  const cards: Drawn[] = mode === "reading" ? draw(LENGTHS[settings.length].cards) : [];
  const context: AskContext = {
    mode,
    tone: settings.tone,
    length: settings.length,
    nickname: profile?.nickname,
    sign: profile?.birth_date ? signOf(profile.birth_date).th : null,
    memories,
    cards,
  };
  const system = systemPrompt(context);
  const turns: Turn[] = [...history, { role: "user", text: userTurn(question) }];
  const maxTokens = mode === "reading" ? LENGTHS[settings.length].maxTokens : 800;

  // readings: Claude first; casual chat: the cheap Gemini first; each falls back to the other
  const order: ("claude" | "gemini")[] =
    mode === "reading" ? ["claude", "gemini"] : ["gemini", "claude"];
  let reply: OwlReply | null = null;
  let engine = "";
  for (const name of order) {
    try {
      if (name === "claude" && env.ANTHROPIC_API_KEY)
        reply = await askClaude(env.ANTHROPIC_API_KEY, system, turns, maxTokens);
      else if (name === "gemini" && env.GEMINI_API_KEY)
        reply = await askGemini(
          env.GEMINI_API_KEY,
          env.GEMINI_MODEL ?? GEMINI_DEFAULT,
          system,
          turns,
          maxTokens,
        );
      if (reply) {
        engine = name;
        break;
      }
    } catch (error) {
      console.log(`ask: ${name} failed`, error instanceof Error ? error.message : error);
    }
  }
  if (!reply) return json({ error: "ai_down" }, 502);

  const stored = cards.map((d) => ({ id: d.card.id, reversed: d.reversed }));
  try {
    const [rec] = await db.rpc<{ chat_id: string; cost: number; balance: number }[]>("ask_record", {
      who: user,
      room: chatId,
      mode,
      length: settings.length,
      question,
      answer: reply.answer,
      cards: stored.length ? stored : null,
      engine,
      notes: reply.remember,
    });
    if (!rec) return json({ error: "server" }, 500);
    return json({
      chatId: rec.chat_id,
      answer: reply.answer,
      cards: stored,
      cost: rec.cost,
      balance: rec.balance,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("not enough coins")) return json({ error: "coins" }, 402);
    if (msg.includes("three rooms")) return json({ error: "rooms" }, 409);
    console.log("ask: record failed", msg);
    return json({ error: "server" }, 500);
  }
}

async function askClaude(
  apiKey: string,
  system: string,
  turns: Turn[],
  maxTokens: number,
): Promise<OwlReply | null> {
  const client = new Anthropic({ apiKey, maxRetries: 1 });
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: turns.map((t) => ({ role: t.role, content: t.text })),
    // a short reading needs little deliberation; low keeps it quick and cheap
    output_config: { effort: "low", format: zodOutputFormat(owlReply) },
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  return response.parsed_output ?? null;
}

async function askGemini(
  apiKey: string,
  model: string,
  system: string,
  turns: Turn[],
  maxTokens: number,
): Promise<OwlReply | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.text }],
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              answer: { type: "STRING" },
              remember: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["answer", "remember"],
          },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${String(res.status)}`);
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  const out = owlReply.safeParse(JSON.parse(text));
  return out.success ? { answer: out.data.answer, remember: out.data.remember.slice(0, 3) } : null;
}

/** Tiny PostgREST client for the tarot schema with the service key (bypasses RLS on purpose). */
function supabase(url: string, key: string) {
  const auth: Record<string, string> = key.startsWith("eyJ")
    ? { apikey: key, Authorization: `Bearer ${key}` }
    : { apikey: key };
  return {
    async user(token: string): Promise<string | null> {
      const res = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: key, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const u = (await res.json()) as { id?: string };
      return u.id ?? null;
    },
    async get<T>(path: string): Promise<T[]> {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        headers: { ...auth, "Accept-Profile": "tarot" },
      });
      if (!res.ok) throw new Error(`select ${path.split("?")[0] ?? ""} ${String(res.status)}`);
      return (await res.json()) as T[];
    },
    async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: { ...auth, "Content-Profile": "tarot", "content-type": "application/json" },
        body: JSON.stringify(args),
      });
      const body = (await res.json().catch(() => null)) as T & { message?: string };
      if (!res.ok)
        throw new Error(
          (body as { message?: string } | null)?.message ?? `rpc ${fn} ${String(res.status)}`,
        );
      return body;
    },
  };
}
