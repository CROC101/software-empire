import { describe, expect, it } from "vitest";
import { b64url, vapidHeaders } from "./vapid";

describe("vapidHeaders", () => {
  it("signs a JWT for the push service origin that the public key verifies", async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ]);
    const publicKey = b64url.encode(
      new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)),
    );
    const { d } = await crypto.subtle.exportKey("jwk", pair.privateKey);

    const now = Date.UTC(2026, 10, 6, 1, 0, 0);
    const { Authorization } = await vapidHeaders(
      "https://fcm.googleapis.com/fcm/send/abc",
      { publicKey, privateKey: d ?? "", subject: "https://crocwork-tarot.example" },
      now,
    );

    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(Authorization);
    expect(match).not.toBeNull();
    const [, head = "", body = "", sig = "", k] = match ?? [];
    expect(k).toBe(publicKey);
    const claims = JSON.parse(new TextDecoder().decode(b64url.decode(body))) as Record<
      string,
      unknown
    >;
    expect(claims).toEqual({
      aud: "https://fcm.googleapis.com",
      exp: now / 1000 + 12 * 3600,
      sub: "https://crocwork-tarot.example",
    });
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      b64url.decode(sig),
      new TextEncoder().encode(`${head}.${body}`),
    );
    expect(ok).toBe(true);
  });

  it("refuses a public key that is not 65 raw bytes", async () => {
    await expect(
      vapidHeaders("https://push.example/x", {
        publicKey: "AAAA",
        privateKey: "x",
        subject: "https://a",
      }),
    ).rejects.toThrow("65 raw bytes");
  });
});
