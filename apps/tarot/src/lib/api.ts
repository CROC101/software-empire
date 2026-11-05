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

/** Insert the first time, update after: only nickname, birthday and gender may be updated. */
export async function saveProfile(userId: string, profile: Profile, exists: boolean) {
  const row = profileSchema.parse(profile);
  const profiles = (await tarot()).from("profiles");
  const { error } = exists
    ? await profiles.update(row).eq("user_id", userId)
    : await profiles.insert({ user_id: userId, ...row });
  if (error) throw error;
}
