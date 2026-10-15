/**
 * Social-graph smoke test over the real Supabase HTTP API (what src/lib/backend/api.ts calls):
 *   pnpm db:start
 *   pnpm --filter @empire/community smoke
 * pgTAP proves the RLS rules; this proves the schema, grants and RPCs are exposed through
 * PostgREST. Creates throwaway smoke-*@example.com users (local Supabase only).
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@empire/core/supabase";

const url = process.env.VITE_SUPABASE_URL ?? "";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
assert.match(url, /localhost|127\.0\.0\.1/, "smoke test signs up users — local Supabase only");

async function newUser(name: string) {
  const client = createClient<Database>(url, key, { auth: { persistSession: false } });
  const email = `smoke-${name}-${String(Date.now())}@example.com`;
  const { data, error } = await client.auth.signUp({ email, password: crypto.randomUUID() });
  assert.equal(error, null);
  assert.ok(data.user);
  return { db: client.schema("community"), id: data.user.id, email };
}

const [alice, bob, carol] = await Promise.all([newUser("alice"), newUser("bob"), newUser("carol")]);

const profile = await alice.db
  .from("profiles")
  .select("display_name")
  .eq("user_id", alice.id)
  .single();
assert.equal(profile.error, null);
assert.equal(profile.data?.display_name, alice.email.split("@")[0]);
console.log("ok  signup created a profile via trigger");

// bob → alice, alice → carol, carol → bob  ⇒ alice is suggested bob
for (const [who, target] of [
  [bob, alice.id],
  [alice, carol.id],
  [carol, bob.id],
] as const) {
  const { error } = await who.db
    .from("follows")
    .insert({ follower_id: who.id, followee_id: target });
  assert.equal(error, null);
}
const suggested = await alice.db.rpc("follow_suggestions", { max_rows: 10 });
assert.equal(suggested.error, null);
assert.deepEqual(
  suggested.data?.map((s) => s.user_id),
  [bob.id],
);
console.log("ok  follows + follow_suggestions RPC over HTTP");

const stats = await alice.db
  .from("profile_stats")
  .select("follower_count")
  .eq("user_id", alice.id)
  .single();
assert.equal(stats.data?.follower_count, 1);
console.log("ok  profile_stats view");

const promote = await alice.db
  .from("profiles")
  .update({ role: "ADMIN" } as never)
  .eq("user_id", alice.id);
assert.ok(promote.error, "a member must not be able to promote themselves");
console.log("ok  role column is not writable by members");

const blocked = await alice.db.rpc("block_user", { target: bob.id });
assert.equal(blocked.error, null);
const bobView = await bob.db.from("profiles").select("user_id").eq("user_id", alice.id);
assert.deepEqual(bobView.data, []);
const bobFollows = await bob.db.from("follows").select("followee_id").eq("follower_id", bob.id);
assert.deepEqual(bobFollows.data, []);
console.log("ok  block_user RPC hides alice from bob and removed bob's follow");
