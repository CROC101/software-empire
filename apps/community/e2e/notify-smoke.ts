/**
 * Live notifications smoke test against local Supabase:
 *   pnpm db:start
 *   pnpm --filter @empire/community smoke:notify
 * Proves notifications reach their recipient over Realtime (and only them), and that search sees
 * through RLS the same way the app does.
 */
import assert from "node:assert/strict";
import {
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@empire/core/supabase";

const url = process.env.VITE_SUPABASE_URL ?? "";
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
assert.match(url, /localhost|127\.0\.0\.1/, "smoke test signs up users — local Supabase only");

async function newUser(name: string) {
  const client: SupabaseClient<Database> = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  const email = `smoke-${name}-${String(Date.now())}@example.com`;
  const { data, error } = await client.auth.signUp({ email, password: crypto.randomUUID() });
  assert.equal(error, null);
  assert.ok(data.user);
  await client.realtime.setAuth();
  return { client, db: client.schema("community"), id: data.user.id };
}

type User = Awaited<ReturnType<typeof newUser>>;

function listen(user: User) {
  const received: { kind: string; user_id: string }[] = [];
  const channel = user.client
    .channel(`notes:${user.id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "community", table: "notifications" },
      (p) => {
        received.push(p.new as { kind: string; user_id: string });
      },
    );
  const ready = new Promise<void>((resolve, reject) => {
    channel.subscribe((state) => {
      if (state === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) resolve();
      if (state === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) reject(new Error("subscribe failed"));
    });
  });
  return { received, ready, channel };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor(check: () => boolean, ms = 6000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await sleep(100);
  }
  return false;
}

const [alice, bob, carol] = await Promise.all([newUser("alice"), newUser("bob"), newUser("carol")]);
const aliceEar = listen(alice);
const carolEar = listen(carol);
await Promise.all([aliceEar.ready, carolEar.ready]);

assert.equal(
  (await bob.db.from("follows").insert({ follower_id: bob.id, followee_id: alice.id })).error,
  null,
);
assert.ok(
  await waitFor(() => aliceEar.received.some((n) => n.kind === "FOLLOW")),
  "alice hears about her new follower live",
);
console.log("ok - a follow reaches the recipient over Realtime");

await sleep(1000);
assert.equal(carolEar.received.length, 0, "carol hears nothing that isn't hers");
console.log("ok - nobody else receives it");

const unread = await alice.db
  .from("notifications")
  .select("id", { count: "exact", head: true })
  .is("read_at", null);
assert.equal(unread.count, 1);
const marked = await alice.db.rpc("mark_all_notifications_read");
assert.equal(marked.data, 1);
console.log("ok - unread count and mark-all-read");

const post = await alice.db.rpc("create_post", { title: "smoke-search-needle", content: "x" });
assert.equal(post.error, null);
const found = await bob.db.rpc("search", { q: "search-needle", kind: "posts" });
assert.equal(found.data?.length, 1);
console.log("ok - search finds a visible post");

await Promise.all([aliceEar.channel.unsubscribe(), carolEar.channel.unsubscribe()]);
await Promise.all([alice.client.removeAllChannels(), carol.client.removeAllChannels()]);
process.exit(0);
