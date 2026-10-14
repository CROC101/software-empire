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
