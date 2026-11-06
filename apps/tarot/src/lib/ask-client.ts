import { z } from "zod";
import type { Length, Mode, Tone } from "./ask";
import { loadSupabase } from "./session";

const tarot = async () => (await loadSupabase()).schema("tarot");

const chat = z.object({ id: z.uuid(), title: z.string(), updated_at: z.string() });
export type Chat = z.infer<typeof chat>;

const message = z.object({
  id: z.number(),
  role: z.enum(["user", "owl"]),
  mode: z.enum(["reading", "chat"]),
  body: z.string(),
  cards: z.array(z.object({ id: z.string(), reversed: z.boolean() })).nullable(),
  cost: z.number(),
  created_at: z.string(),
});
export type Message = z.infer<typeof message>;

export type ChatSettings = {
  tone: Tone;
  length: Length;
  remember_profile: boolean;
  remember_notes: boolean;
};
export const DEFAULT_SETTINGS: ChatSettings = {
  tone: "casual",
  length: "medium",
  remember_profile: true,
  remember_notes: true,
};

export async function getChats(): Promise<Chat[]> {
  const { data, error } = await (
    await tarot()
  )
    .from("chats")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return z.array(chat).parse(data);
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await (
    await tarot()
  )
    .from("chat_messages")
    .select("id, role, mode, body, cards, cost, created_at")
    .eq("chat_id", chatId)
    .order("id");
  if (error) throw error;
  return z.array(message).parse(data);
}

export async function getChatSettings(): Promise<ChatSettings> {
  const { data, error } = await (
    await tarot()
  )
    .from("chat_settings")
    .select("tone, length, remember_profile, remember_notes")
    .maybeSingle();
  if (error) throw error;
  return (data as ChatSettings | null) ?? DEFAULT_SETTINGS;
}

const answer = z.object({
  chatId: z.uuid(),
  answer: z.string(),
  cards: z.array(z.object({ id: z.string(), reversed: z.boolean() })),
  cost: z.number(),
  balance: z.number(),
});
export type Answer = z.infer<typeof answer>;

export class AskError extends Error {
  constructor(
    readonly code: string,
    readonly cost?: number,
  ) {
    super(code);
  }
}

/** One message to the owl through the tarot Worker, signed with the reader's session. */
export async function sendAsk(
  chatId: string | null,
  mode: Mode,
  question: string,
): Promise<Answer> {
  const supabase = await loadSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AskError("sign_in");
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ chatId, mode, question }),
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string; cost?: number };
  if (!res.ok) throw new AskError(body.error ?? "server", body.cost);
  return answer.parse(body);
}
