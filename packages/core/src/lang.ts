// The reader's language, shared by every crocwork app like the theme: one cookie on the parent
// domain, so switching to English in the hub or a toolbox app switches it everywhere.
import { dropHostOnlyTwin } from "./theme";

export type Lang = "th" | "en";
export const LANG_COOKIE = "em-lang";
const YEAR_S = 60 * 60 * 24 * 365;

export function readLang(cookie: string): Lang {
  return /(?:^|;\s*)em-lang=en(?:;|$)/.test(cookie) ? "en" : "th";
}

export function langCookie(lang: Lang, cookieDomain?: string): string {
  const domain = cookieDomain ? `; Domain=${cookieDomain}` : "";
  return `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${String(YEAR_S)}; SameSite=Lax${domain}`;
}

export function setLang(lang: Lang, cookieDomain?: string): void {
  dropHostOnlyTwin(LANG_COOKIE, cookieDomain);
  document.cookie = langCookie(lang, cookieDomain);
  document.documentElement.lang = lang;
}
