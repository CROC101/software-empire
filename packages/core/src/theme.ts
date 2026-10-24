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

export function setThemeChoice(choice: ThemeChoice, cookieDomain?: string): void {
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
`;

/* ── ambience: seasonal / space particles, shared by every app like the theme ── */

export type Ambience = "auto" | "space" | "rain" | "snow" | "bloom" | "off";
export type Season = Exclude<Ambience, "auto" | "off">;

export const AMBIENCE_COOKIE = "em-ambience";
export const AMBIENCES: readonly Ambience[] = ["auto", "space", "rain", "snow", "bloom", "off"];

export function readAmbience(cookie: string): Ambience {
  const match = new RegExp(`(?:^|;\\s*)${AMBIENCE_COOKIE}=([^;]*)`).exec(cookie);
  const value = match?.[1];
  return AMBIENCES.includes(value as Ambience) ? (value as Ambience) : "auto";
}

/**
 * Thai calendar, roughly: hot season Mar–May (golden-shower petals), rains Jun–Oct,
 * cool season Nov–Feb (frost). "auto" in dark mode is always space: meteors at night.
 */
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
  document.cookie = `${AMBIENCE_COOKIE}=${value}; Path=/; Max-Age=${String(YEAR_S)}; SameSite=Lax${domain}`;
  // same nudge as the theme: other components re-read on focus
  window.dispatchEvent(new Event("focus"));
}
