import { GATE_PATH } from "@empire/core/launch";

export { LAUNCH_AT, launched } from "@empire/core/launch";

/** Paths a visitor may still open before launch: the countdown, signing in, static files. */
export function openBeforeLaunch(pathname: string) {
  return (
    pathname === "/soon" ||
    pathname === "/login" ||
    pathname === GATE_PATH ||
    pathname.startsWith("/auth/") ||
    // theme-boot.js, fonts, robots.txt, icons…: the countdown page needs them too
    /\.[a-z0-9]+$/i.test(pathname)
  );
}
