import "server-only";
import { createClient } from "@/lib/supabase/server";

/** The commerce schema as the signed-in user — RLS decides what comes back. */
export async function db() {
  return (await createClient()).schema("commerce");
}

/** Verified user id, or null. Never trust getSession() on the server. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims.sub;
  return typeof sub === "string" ? sub : null;
}

export async function isStaff(): Promise<boolean> {
  const { data } = await (await db()).rpc("is_staff");
  return data === true;
}

/** Wallet balance in satang: the sum of this user's ledger entries. */
export async function walletBalance(): Promise<number> {
  const { data } = await (await db()).from("my_wallet").select("amount_satang");
  return (data ?? []).reduce((sum, row) => sum + (row.amount_satang ?? 0), 0);
}
