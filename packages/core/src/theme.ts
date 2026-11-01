/**
 * One theme for every app in the portfolio, any number of them.
 *
 * The choice lives in a cookie on the parent domain, the same way the login session is shared
 * (see authCookieOptions): localStorage is per-origin and would leave every app with its own
 * theme. Locally the cookie is host-only on "localhost", which every port already shares.
 *
 * Contract on <html>, so any app's CSS works unchanged:
 *   class "dark" | "light"   — the resolved theme (@empire/ui tokens, Community)
 *   data-theme="light|dark|system" — the raw choice (Canvas)
 *   style.colorScheme        — native form controls and scrollbars
 *
 * public/theme-boot.js in each app repeats readChoice + apply before first paint; the
 * theme-boot test keeps every copy identical to THEME_BOOT_SCRIPT.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_COOKIE = "em-theme";
/** LITE mode cookie (see the LITE block below); declared here because the boot script uses it. */
export const LITE_COOKIE = "em-lite";
const YEAR_S = 60 * 60 * 24 * 365;

export function parseChoice(value: unknown): ThemeChoice {
  return value === "dark" || value === "system" ? value : "light";
}

export function readChoice(cookie: string): ThemeChoice {
  const match = new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`).exec(cookie);
  return parseChoice(match?.[1]);
}

/** `cookieDomain` = the same value given to authCookieOptions (unset on localhost). */
export function themeCookie(choice: ThemeChoice, cookieDomain?: string): string {
  const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";
  return `${THEME_COOKIE}=${choice}; Path=/; Max-Age=${String(YEAR_S)}; SameSite=Lax${domain}`;
}

export function resolve(choice: ThemeChoice, osDark: boolean): ResolvedTheme {
  return choice === "dark" || (choice === "system" && osDark) ? "dark" : "light";
}

// optional chaining: test DOMs (jsdom) and old embedded browsers lack matchMedia
const darkQuery = (): MediaQueryList | undefined =>
  // typeof, not `in`: test DOMs may define the property as undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : undefined;
export const osDark = () => darkQuery()?.matches ?? false;

export function applyTheme(choice: ThemeChoice): ResolvedTheme {
  const theme = resolve(choice, osDark());
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.dataset.theme = choice;
  root.style.colorScheme = theme;
  return theme;
}

/**
 * A shared cookie (Domain=…) does not replace a host-only one of the same name written before
 * COOKIE_DOMAIN was set: the browser keeps both and sends the old one first, so a theme switch
 * snapped back. Writing the shared value also expires that host-only twin.
 */
export function dropHostOnlyTwin(name: string, cookieDomain?: string): void {
  if (cookieDomain) document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setThemeChoice(choice: ThemeChoice, cookieDomain?: string): void {
  dropHostOnlyTwin(THEME_COOKIE, cookieDomain);
  document.cookie = themeCookie(choice, cookieDomain);
  applyTheme(choice);
}

export function currentChoice(): ThemeChoice {
  return readChoice(document.cookie);
}

/**
 * Re-applies whenever the choice may have changed elsewhere: another app or tab (cookieStore
 * change where supported, otherwise when this tab regains focus) or the OS setting.
 * Returns an unsubscribe for useSyncExternalStore.
 */
export function subscribeTheme(onChange: () => void): () => void {
  let last = currentChoice();
  const check = () => {
    const now = currentChoice();
    if (now !== last) {
      last = now;
      applyTheme(now);
    }
    onChange();
  };
  const media = darkQuery();
  const onMedia = () => {
    applyTheme(currentChoice());
    onChange();
  };
  const store = (window as { cookieStore?: EventTarget }).cookieStore;
  store?.addEventListener("change", check);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  media?.addEventListener("change", onMedia);
  return () => {
    store?.removeEventListener("change", check);
    window.removeEventListener("focus", check);
    document.removeEventListener("visibilitychange", check);
    media?.removeEventListener("change", onMedia);
  };
}

/** Body of every app's public/theme-boot.js (CSP forbids inline scripts, so it ships as a file). */
export const THEME_BOOT_SCRIPT = `// Generated from @empire/core/theme — keep identical in every app (theme-boot test).
// Runs before first paint: applies the shared em-theme cookie so no app flashes the wrong theme.
/* eslint-disable -- generated asset, linted as part of @empire/core/theme */
try {
  var m = /(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/.exec(document.cookie);
  var c = m && (m[1] === "dark" || m[1] === "system") ? m[1] : "light";
  var d = c === "dark" || (c === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  var r = document.documentElement;
  r.classList.toggle("dark", d);
  r.classList.toggle("light", !d);
  r.dataset.theme = c;
  r.style.colorScheme = d ? "dark" : "light";
} catch {
  // cookies blocked: keep the default light theme
}
try {
  // LITE: em-lite=on|off, or auto = phones and data-saver. Every effect already falls back to a
  // still frame for reduced motion, so LITE answers that media query with "reduce".
  var l = /(?:^|;\\s*)${LITE_COOKIE}=(on|off)(?:;|$)/.exec(document.cookie);
  var n = navigator.connection;
  var lite = l
    ? l[1] === "on"
    : (matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 768) ||
      (n && n.saveData) === true;
  document.documentElement.dataset.lite = lite ? "on" : "off";
  if (lite) {
    var mm = window.matchMedia.bind(window);
    window.matchMedia = function (q) {
      return /prefers-reduced-motion/.test(q)
        ? mm(/no-preference/.test(q) ? "not all" : "all")
        : mm(q);
    };
    // the device's own answer, for the few things that keep moving in LITE (see osReducedMotion)
    window.matchMedia.real = mm;
  }
} catch {
  // no matchMedia or cookies: full effects, as before
}
`;

/* ── LITE: fewer effects for hot phones, shared by every app like the theme ── */

export type LiteChoice = "auto" | "on" | "off";

export function readLite(cookie: string): LiteChoice {
  const value = new RegExp(`(?:^|;\\s*)${LITE_COOKIE}=([^;]*)`).exec(cookie)?.[1];
  return value === "on" || value === "off" ? value : "auto";
}

/** What the boot script decided for this page (auto resolved), read from <html data-lite>. */
export const liteActive = () => document.documentElement.dataset.lite === "on";

/**
 * The device's real reduced-motion setting, ignoring LITE. Only for something the owner wants
 * moving even on phones in LITE (the launch countdown); everything else asks matchMedia.
 */
export function osReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return true;
  // read as a value, never called unbound: only its `real` property is used
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const patched = window.matchMedia as typeof window.matchMedia & {
    real?: typeof window.matchMedia;
  };
  const query = "(prefers-reduced-motion: reduce)";
  return (patched.real ? patched.real(query) : window.matchMedia(query)).matches;
}

/** Saves the choice and reloads: effects read LITE once, at start, like reduced motion. */
export function setLite(choice: LiteChoice, cookieDomain?: string): void {
  const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";
  // auto = forget the choice, so the device decides again
  const age = choice === "auto" ? 0 : YEAR_S;
  dropHostOnlyTwin(LITE_COOKIE, cookieDomain);
  document.cookie = `${LITE_COOKIE}=${choice}; Path=/; Max-Age=${String(age)}; SameSite=Lax${domain}`;
  location.reload();
}

/* ── ambience: seasonal / space particles, shared by every app like the theme ── */

export type Festival = "halloween" | "loykrathong" | "christmas" | "newyear" | "songkran";
export type Ambience = "auto" | "space" | "rain" | "snow" | "bloom" | Festival | "off";
/** What the sky actually shows: a season or a festival. */
export type Season = Exclude<Ambience, "auto" | "off">;

export const AMBIENCE_COOKIE = "em-ambience";
export const FESTIVALS: readonly Festival[] = [
  "halloween",
  "loykrathong",
  "christmas",
  "newyear",
  "songkran",
];
export const AMBIENCES: readonly Ambience[] = [
  "auto",
  "space",
  "rain",
  "snow",
  "bloom",
  ...FESTIVALS,
  "off",
];

export function readAmbience(cookie: string): Ambience {
  const match = new RegExp(`(?:^|;\\s*)${AMBIENCE_COOKIE}=([^;]*)`).exec(cookie);
  const value = match?.[1];
  return AMBIENCES.includes(value as Ambience) ? (value as Ambience) : "auto";
}

/**
 * Thai calendar, roughly: hot season Mar–May (golden-shower petals), rains Jun–Oct,
 * cool season Nov–Feb (frost). "auto" in dark mode is always space: meteors at night.
 */
/**
 * Festival windows (month 0-based, day of month), Thai and international. Loy Krathong follows
 * the lunar calendar (late Nov most years), so its window covers the second half of November.
 */
export function festivalFor(month: number, day: number): Festival | null {
  if (month === 9 && day >= 15) return "halloween";
  if (month === 10 && day >= 10) return "loykrathong";
  if (month === 11 && day >= 15 && day < 28) return "christmas";
  if ((month === 11 && day >= 28) || (month === 0 && day <= 5)) return "newyear";
  if (month === 3 && day >= 10 && day <= 18) return "songkran";
  return null;
}

export function seasonFor(month: number, dark: boolean): Season {
  if (dark) return "space";
  if (month >= 2 && month <= 4) return "bloom";
  if (month >= 5 && month <= 9) return "rain";
  return "snow";
}

export function currentAmbience(): Ambience {
  return readAmbience(document.cookie);
}

export function setAmbience(value: Ambience, cookieDomain?: string): void {
  const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";
  dropHostOnlyTwin(AMBIENCE_COOKIE, cookieDomain);
  document.cookie = `${AMBIENCE_COOKIE}=${value}; Path=/; Max-Age=${String(YEAR_S)}; SameSite=Lax${domain}`;
  // same nudge as the theme: other components re-read on focus
  window.dispatchEvent(new Event("focus"));
}
