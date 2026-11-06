import { z } from "zod";
import { loadSupabase } from "./session";

/** What the reader sees about their coins; the numbers only change inside tarot.check_in(). */
export const statusSchema = z.object({
  coins: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  checked_today: z.boolean(),
});
export type Status = z.infer<typeof statusSchema>;

const checkInSchema = statusSchema.extend({ earned: z.number().int().nonnegative() });
export type CheckIn = z.infer<typeof checkInSchema>;

export const GENDERS = [
  { id: "male", label: "ชาย" },
  { id: "female", label: "หญิง" },
  { id: "lgbtq", label: "LGBTQ+" },
  { id: "unspecified", label: "ไม่ระบุ" },
] as const;

/** Mirrors the table's checks, so a bad form never reaches the database. */
export const profileSchema = z.object({
  nickname: z.string().trim().min(2, "ชื่อเล่นอย่างน้อย 2 ตัวอักษร").max(30, "ไม่เกิน 30 ตัวอักษร"),
  birth_date: z.iso.date().nullable(),
  gender: z.enum(["male", "female", "lgbtq", "unspecified"]),
});
export type Profile = z.infer<typeof profileSchema>;

const tarot = async () => (await loadSupabase()).schema("tarot");

export async function getStatus(): Promise<Status> {
  const { data, error } = await (await tarot()).rpc("my_status");
  if (error) throw error;
  return statusSchema.parse(Array.isArray(data) ? data[0] : data);
}

export async function checkIn(): Promise<CheckIn> {
  const { data, error } = await (await tarot()).rpc("check_in");
  if (error) throw error;
  return checkInSchema.parse(Array.isArray(data) ? data[0] : data);
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await (
    await tarot()
  )
    .from("profiles")
    .select("nickname, birth_date, gender")
    .maybeSingle();
  if (error) throw error;
  return data ? profileSchema.parse(data) : null;
}

/** Days in [from, to] the reader checked in, with what each paid. */
export async function getCheckins(from: string, to: string) {
  const { data, error } = await (
    await tarot()
  )
    .from("checkins")
    .select("day, coins")
    .gte("day", from)
    .lte("day", to);
  if (error) throw error;
  return z.array(z.object({ day: z.iso.date(), coins: z.number().int() })).parse(data);
}

const storedCard = z.object({ id: z.string(), reversed: z.boolean() });
const readingSchema = z.object({
  id: z.uuid(),
  spread: z.string(),
  topic: z.enum(["general", "love", "work", "money"]),
  question: z.string().nullable(),
  cards: z.array(storedCard),
  cost: z.number().int(),
  created_at: z.string(),
});
export type StoredReading = z.infer<typeof readingSchema>;

/** Keep a reading and pay for it in one step; the database refuses it if coins are short. */
export async function recordReading(
  spread: string,
  topic: string,
  question: string,
  cards: { id: string; reversed: boolean }[],
): Promise<number> {
  const { data, error } = await (
    await tarot()
  ).rpc("record_reading", {
    spread,
    topic,
    question,
    cards,
  });
  if (error) throw error;
  return z.number().int().parse(data);
}

export async function getReadings(): Promise<StoredReading[]> {
  const { data, error } = await (
    await tarot()
  )
    .from("readings")
    .select("id, spread, topic, question, cards, cost, created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return z.array(readingSchema).parse(data);
}

/** Take a reading out of the history; its coins stay spent. */
export async function hideReading(id: string) {
  const { error } = await (await tarot()).from("readings").update({ hidden: true }).eq("id", id);
  if (error) throw error;
}

/** Insert the first time, update after: only nickname, birthday and gender may be updated. */
export async function saveProfile(userId: string, profile: Profile, exists: boolean) {
  const row = profileSchema.parse(profile);
  const profiles = (await tarot()).from("profiles");
  const { error } = exists
    ? await profiles.update(row).eq("user_id", userId)
    : await profiles.insert({ user_id: userId, ...row });
  if (error) throw error;
}
