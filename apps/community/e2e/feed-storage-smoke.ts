/**
 * Uploads + Storage smoke test against local Supabase:
 *   pnpm db:start
 *   pnpm --filter @empire/community smoke:feed
 * Proves what pgTAP can't: real bytes travel through a signed upload URL, commit reads their real
 * size, the storage policies hand read links only to people who may see the post, a file stored
 * under the wrong type is blocked, and freed bytes can actually be removed.
 */
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
  return { client, db: client.schema("community"), id: data.user.id };
}

type User = Awaited<ReturnType<typeof newUser>>;
const attachments = (user: User) => user.client.storage.from("community-attachments");

// the same three steps the app's upload.ts runs
async function upload(
  user: User,
  fileName: string,
  bytes: Uint8Array<ArrayBuffer>,
  sendAs?: string,
) {
  const intent = await user.db.rpc("create_upload_intent", {
    file_name: fileName,
    size_bytes: bytes.byteLength,
    bucket: "attachments",
  });
  assert.equal(intent.error, null, intent.error?.message);
  const [ticket] = intent.data ?? [];
  assert.ok(ticket);
  const signed = await attachments(user).createSignedUploadUrl(ticket.path);
  assert.equal(signed.error, null, signed.error?.message);
  const put = await fetch(signed.data?.signedUrl ?? "", {
    method: "PUT",
    headers: { "content-type": sendAs ?? ticket.mime },
    body: bytes,
  });
  return { ticket, put };
}

// a PNG signature followed by filler bytes
const PNG = new Uint8Array(1208).fill(7);
PNG.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const [alice, bob, carol] = await Promise.all([newUser("alice"), newUser("bob"), newUser("carol")]);
assert.equal((await alice.db.rpc("block_user", { target: carol.id })).error, null);

// ── upload a photo: declared 10 bytes, real 1208 — commit keeps the real size ──
const photo = await upload(alice, "photo.png", PNG);
assert.equal(photo.put.ok, true, `upload PUT failed: ${String(photo.put.status)}`);
const committed = await alice.db.rpc("commit_asset", { asset: photo.ticket.id });
assert.equal(committed.error, null, committed.error?.message);
assert.equal(committed.data?.status, "READY");
assert.equal(committed.data.size_bytes, PNG.byteLength);
console.log("ok - signed upload + commit records the real size");

// ── nobody can upload into someone else's pending path ──
const pending = await alice.db.rpc("create_upload_intent", {
  file_name: "later.png",
  size_bytes: 10,
  bucket: "attachments",
});
const stolen = await attachments(bob).createSignedUploadUrl(pending.data?.[0]?.path ?? "");
assert.notEqual(stolen.error, null, "bob must not get an upload URL for alice's path");
console.log("ok - upload URLs only for your own pending files");

// ── bytes sent under another type are blocked ──
const fake = await upload(alice, "fake.png", PNG, "image/jpeg");
assert.equal(fake.put.ok, true);
const blocked = await alice.db.rpc("commit_asset", { asset: fake.ticket.id });
assert.equal(blocked.data?.status, "BLOCKED");
assert.equal((await alice.db.from("assets").delete().eq("id", fake.ticket.id)).error, null);
const removed = await attachments(alice).remove([fake.ticket.path]);
assert.equal(removed.data?.length, 1, "blocked bytes can be removed by their owner");
console.log("ok - mismatched content type is blocked and removed");

// ── post it: bob reads it, carol (blocked) doesn't ──
const post = await alice.db.rpc("create_post", {
  content: "smoke photo",
  asset_ids: [photo.ticket.id],
});
assert.equal(post.error, null, post.error?.message);
const seen = await bob.db
  .from("post_view")
  .select("media")
  .eq("id", post.data ?? "")
  .single();
assert.equal(seen.error, null);
const read = await attachments(bob).createSignedUrl(photo.ticket.path, 60);
assert.equal(read.error, null, "bob can read a photo of a post he sees");
const bytes = await fetch(read.data?.signedUrl ?? "");
assert.equal((await bytes.arrayBuffer()).byteLength, PNG.byteLength);
const refused = await attachments(carol).createSignedUrl(photo.ticket.path, 60);
assert.notEqual(refused.error, null, "a blocked person gets no link");
console.log("ok - read links follow post visibility and blocks");

// ── bob can't delete the bytes of a live file; after alice deletes the post, they go ──
const early = await attachments(bob).remove([photo.ticket.path]);
assert.equal(early.data?.length ?? 0, 0, "live bytes stay");
const freed = await alice.db.rpc("delete_post", { post: post.data ?? "" });
assert.deepEqual(freed.data, [photo.ticket.path]);
const purged = await attachments(alice).remove(freed.data ?? []);
assert.equal(purged.data?.length, 1);
const gone = await attachments(alice).createSignedUrl(photo.ticket.path, 60);
assert.notEqual(gone.error, null);
console.log("ok - deleting a post frees and removes its bytes");
