/**
 * VAPID (RFC 8292): the header that proves a push comes from this app's server. The reminder is
 * an empty push (the service worker writes the text), so no payload encryption is needed: one
 * ES256-signed JWT per push service origin. WebCrypto only, so it runs in a Cloudflare Worker.
 */

const b64url = {
  encode(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  },
  decode(text: string): Uint8Array<ArrayBuffer> {
    const s = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  },
};
export { b64url };

/** The P-256 private key from the 65-byte public key and the private scalar `d`. */
async function signingKey(publicKey: string, privateKey: string) {
  const pub = b64url.decode(publicKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error("VAPID public key must be 65 raw bytes");
  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: b64url.encode(pub.slice(1, 33)),
      y: b64url.encode(pub.slice(33, 65)),
      d: privateKey,
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/** Headers for one push to `endpoint`, valid for 12 hours. */
export async function vapidHeaders(
  endpoint: string,
  keys: { publicKey: string; privateKey: string; subject: string },
  now = Date.now(),
): Promise<{ Authorization: string }> {
  const enc = new TextEncoder();
  const part = (o: object) => b64url.encode(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({
    aud: new URL(endpoint).origin,
    exp: Math.floor(now / 1000) + 12 * 3600,
    sub: keys.subject,
  })}`;
  const key = await signingKey(keys.publicKey, keys.privateKey);
  // WebCrypto signs ECDSA as raw r||s, which is exactly what JWS ES256 wants
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned)),
  );
  return { Authorization: `vapid t=${unsigned}.${b64url.encode(sig)}, k=${keys.publicKey}` };
}
