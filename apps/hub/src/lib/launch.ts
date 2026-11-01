/**
 * Until launch the hub shows only the countdown at /soon; CMS admins (cms.is_admin) see
 * everything. The gate opens by itself at this moment, no deploy needed.
 * 1 มกราคม 2570, midnight Thai time.
 */
export const LAUNCH_AT = Date.parse("2027-01-01T00:00:00+07:00");

export const launched = (now = Date.now()) => now >= LAUNCH_AT;

/** Paths a visitor may still open before launch: the countdown, signing in, static files. */
export function openBeforeLaunch(pathname: string) {
  return (
    pathname === "/soon" ||
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    // theme-boot.js, fonts, robots.txt, icons…: the countdown page needs them too
    /\.[a-z0-9]+$/i.test(pathname)
  );
}
