import "server-only";
import { safeRedirectTarget } from "@empire/core/redirect";
import { z } from "zod";
import { subsystems } from "./subsystems";

const httpUrl = z.url({ protocol: /^https?$/ });

/** Subsystems that live as a page inside the hub itself, not as a deployed app. */
const HUB_PAGES: Partial<Record<string, string>> = { crocbyte: "/crocbyte" };

/** Where a subsystem lives: a hub page, else server env APP_URL_<SLUG>. Unset = not live yet. */
export function appUrl(slug: string): string | undefined {
  const page = HUB_PAGES[slug];
  if (page) return page;
  const raw = process.env[`APP_URL_${slug.toUpperCase()}`];
  return raw ? httpUrl.parse(raw) : undefined;
}

/** Only deployed Empire apps may receive the user back after sign-in. */
const appOrigins = subsystems.flatMap(({ slug }) => {
  const url = appUrl(slug);
  return url && !url.startsWith("/") ? [new URL(url).origin] : [];
});

export function safeNext(value: unknown): string {
  // the hub is the portfolio: after sign-in land on it, not on the dashboard
  return safeRedirectTarget(value, appOrigins, "/");
}
