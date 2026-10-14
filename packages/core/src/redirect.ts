/**
 * Return `value` only if it is a same-origin path, otherwise `fallback`.
 * Use on every `?next=` before redirecting, or the login flow becomes an open redirect.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  // "//evil.com" and "/\evil.com" are protocol-relative URLs to another host
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex -- control chars are exactly what we reject
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

/**
 * Like `safeRedirectPath`, but also accepts an absolute URL whose origin is in
 * `allowedOrigins` — how other Empire apps get the user back after signing in at the hub.
 */
export function safeRedirectTarget(
  value: unknown,
  allowedOrigins: readonly string[],
  fallback = "/",
): string {
  const path = safeRedirectPath(value, "");
  if (path) return path;
  if (typeof value !== "string" || !URL.canParse(value)) return fallback;

  const url = new URL(value);
  // compare parsed origins so "http://app.com@evil.com" or a trailing slash can't sneak through
  const allowed = allowedOrigins.some(
    (origin) => URL.canParse(origin) && new URL(origin).origin === url.origin,
  );
  return allowed ? url.href : fallback;
}
