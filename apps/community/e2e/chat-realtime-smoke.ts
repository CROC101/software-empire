/**
 * Chat + Realtime smoke test against local Supabase:
 *   pnpm db:start
 *   pnpm --filter @empire/community smoke:chat
 * Proves the parts unit tests can't: members receive new messages and typing over Realtime,
 * and an outsider is refused the private room topic and receives nothing.
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

function subscribe(channel: RealtimeChannel): Promise<REALTIME_SUBSCRIBE_STATES> {
  return new Promise((resolve) => {
    channel.subscribe((state) => {
      if (state !== REALTIME_SUBSCRIBE_STATES.CLOSED) resolve(state);
    });
  });
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const within = <T>(ms: number, promise: Promise<T>, label: string) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)),
  ]);

const [alice, bob, carol] = await Promise.all([newUser("alice"), newUser("bob"), newUser("carol")]);

const opened = await alice.db.rpc("open_direct", { peers: [bob.id] });
assert.equal(opened.error, null);
const room = opened.data ?? "";

// bob listens like the app does: postgres_changes on the room + private broadcast topic
const bobTyping = deferred<string>();
const bobJoined = deferred<REALTIME_SUBSCRIBE_STATES>();
const bobGotMessage = new Promise<string>((resolve) => {
  const channel = bob.client
    .channel(`room:${room}`, { config: { private: true } })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "community", table: "messages", filter: `channel_id=eq.${room}` },
      (p) => {
        resolve((p.new as { content: string }).content);
      },
    )
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      bobTyping.resolve((payload as { coreUserId: string }).coreUserId);
    });
  void subscribe(channel).then((state) => {
    bobJoined.resolve(state);
  });
});
assert.equal(
  await within(10_000, bobJoined.promise, "bob joins"),
  REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
);
console.log("ok  member joins the private room topic");

// carol (not a member) tries the same topic and listens for the same rows
let carolSaw = 0;
const carolChannel = carol.client
  .channel(`room:${room}`, { config: { private: true } })
  .on("postgres_changes", { event: "INSERT", schema: "community", table: "messages" }, () => {
    carolSaw += 1;
  });
const carolState = await within(10_000, subscribe(carolChannel), "carol subscribe attempt");
assert.notEqual(
  carolState,
  REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
  "outsider must not join the private room topic",
);
console.log("ok  outsider is refused the private room topic");

// a second outsider channel without the private topic: RLS must still hide the rows
const carolPublic = carol.client
  .channel(`spy:${room}`)
  .on("postgres_changes", { event: "INSERT", schema: "community", table: "messages" }, () => {
    carolSaw += 1;
  });
await within(10_000, subscribe(carolPublic), "carol public subscribe");

// alice joins too and types, then sends
const aliceChannel = alice.client.channel(`room:${room}`, { config: { private: true } });
assert.equal(
  await within(10_000, subscribe(aliceChannel), "alice joins"),
  REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
);
await aliceChannel.send({ type: "broadcast", event: "typing", payload: { coreUserId: alice.id } });
assert.equal(await within(10_000, bobTyping.promise, "typing"), alice.id);
console.log("ok  typing reaches the other member");

const sent = await alice.db.rpc("send_message", {
  channel: room,
  body: "สวัสดีบ็อบ",
  nonce: "smoke-1",
});
assert.equal(sent.error, null);
assert.equal(await within(10_000, bobGotMessage, "message delivery"), "สวัสดีบ็อบ");
console.log("ok  new message reaches the member over Realtime");

await new Promise((resolve) => setTimeout(resolve, 1500));
assert.equal(carolSaw, 0, "outsider received a message row");
console.log("ok  outsider received nothing");

await Promise.all([
  alice.client.removeAllChannels(),
  bob.client.removeAllChannels(),
  carol.client.removeAllChannels(),
]);
process.exit(0);
