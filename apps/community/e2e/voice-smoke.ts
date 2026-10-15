/**
 * Calls + WebRTC signalling smoke test against local Supabase:
 *   pnpm db:start
 *   pnpm --filter @empire/community smoke:voice
 * Proves the realtime half of a call without a browser: the ring reaches the callee's private
 * topic, the answer reaches the caller, an offer travels over the session topic, and an outsider
 * can neither join the session topic nor overhear the ring.
 */
import assert from "node:assert/strict";
import {
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
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
type Heard = { event: string; payload: Record<string, unknown> };

function join(user: User, topic: string, events: string[]) {
  const heard: Heard[] = [];
  const channel: RealtimeChannel = user.client.channel(topic, { config: { private: true } });
  for (const event of events)
    channel.on("broadcast", { event }, ({ payload }) => {
      heard.push({ event, payload: payload as Record<string, unknown> });
    });
  const state = new Promise<REALTIME_SUBSCRIBE_STATES>((resolve) => {
    channel.subscribe((s) => {
      if (s !== REALTIME_SUBSCRIBE_STATES.CLOSED) resolve(s);
    });
  });
  return { heard, state, channel };
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
const dm = await alice.db.rpc("open_direct", { peers: [bob.id] });
assert.equal(dm.error, null);

const alicePersonal = join(alice, `user:${alice.id}`, ["call:answered"]);
const bobPersonal = join(bob, `user:${bob.id}`, ["call:incoming"]);
const carolSnoop = join(carol, `user:${bob.id}`, ["call:incoming"]);
assert.equal(await alicePersonal.state, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
assert.equal(await bobPersonal.state, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
await carolSnoop.state;

const joined = await alice.db.rpc("join_voice", { channel: dm.data ?? "" });
assert.equal(joined.error, null, joined.error?.message);
const session = (joined.data as { id: string }).id;

const ring = await alice.db.rpc("call_ring", { session, callee: bob.id, media: "AUDIO" });
assert.equal(ring.error, null, ring.error?.message);
assert.ok(
  await waitFor(() => bobPersonal.heard.some((h) => h.event === "call:incoming")),
  "bob's phone rings",
);
console.log("ok - the ring reaches the callee's private topic");
await sleep(800);
assert.equal(carolSnoop.heard.length, 0, "carol cannot listen to bob's topic");
console.log("ok - nobody else hears the ring");

assert.equal((await bob.db.rpc("join_voice", { channel: dm.data ?? "" })).error, null);
assert.equal(
  (await bob.db.rpc("call_answer", { session, caller: alice.id, accepted: true })).error,
  null,
);
assert.ok(
  await waitFor(() => alicePersonal.heard.some((h) => h.event === "call:answered")),
  "alice hears the answer",
);
console.log("ok - the answer reaches the caller");

const aliceVoice = join(alice, `voice:${session}`, ["rtc:signal"]);
const bobVoice = join(bob, `voice:${session}`, ["rtc:signal"]);
const carolVoice = join(carol, `voice:${session}`, ["rtc:signal"]);
assert.equal(await aliceVoice.state, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
assert.equal(await bobVoice.state, REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
await carolVoice.state;
await aliceVoice.channel.send({
  type: "broadcast",
  event: "rtc:signal",
  payload: { toCoreUserId: bob.id, fromCoreUserId: alice.id, kind: "offer", data: { sdp: "v=0" } },
});
assert.ok(
  await waitFor(() => bobVoice.heard.some((h) => h.payload.kind === "offer")),
  "the offer reaches bob",
);
console.log("ok - WebRTC signals travel over the session topic");
await sleep(800);
assert.equal(carolVoice.heard.length, 0, "an outsider hears no signals");
console.log("ok - outsiders are kept out of the session topic");

const ended = await alice.db.rpc("call_end", { session, peer: bob.id });
assert.equal(ended.error, null);
const log = await alice.db.from("call_logs").select("status").eq("session_id", session).single();
assert.equal(log.data?.status, "ANSWERED");
console.log("ok - the call card ends as answered");

await Promise.all([
  alice.client.removeAllChannels(),
  bob.client.removeAllChannels(),
  carol.client.removeAllChannels(),
]);
process.exit(0);
