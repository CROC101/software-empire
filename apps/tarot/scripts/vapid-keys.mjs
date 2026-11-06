/* global URL, console, process, Buffer */
// Makes a VAPID key pair for push notifications and writes it to apps/tarot/.dev.vars (gitignored).
// The public key goes in src/lib/vapid-public.ts; the private key is a Cloudflare secret
// (VAPID_PRIVATE_KEY on the crocwork-tarot Worker) and must never be committed.
// Run: node apps/tarot/scripts/vapid-keys.mjs
import { writeFileSync, existsSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const out = new URL("../.dev.vars", import.meta.url);
if (existsSync(out)) {
  console.error(".dev.vars already exists; delete it first to make a new pair");
  process.exit(1);
}
const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
  "sign",
]);
const raw = Buffer.from(await crypto.subtle.exportKey("raw", pair.publicKey)).toString("base64url");
const { d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
writeFileSync(out, `VAPID_PUBLIC_KEY=${raw}\nVAPID_PRIVATE_KEY=${d}\n`, { mode: 0o600 });
console.log(`public key: ${raw}`);
console.log("private key written to apps/tarot/.dev.vars (not printed)");
