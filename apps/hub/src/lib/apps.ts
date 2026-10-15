import "server-only";
import { safeRedirectTarget } from "@empire/core/redirect";
import { z } from "zod";
import { subsystems } from "./subsystems";

const httpUrl = z.url({ protocol: /^https?$/ });

/** Where a subsystem is deployed, from server env APP_URL_<SLUG>. Unset = not live yet. */
export function appUrl(slug: string): string | undefined {
  const raw = process.env[`APP_URL_${slug.toUpperCase()}`];
  return raw ? httpUrl.parse(raw) : undefined;
}

/** Only deployed Empire apps may receive the user back after sign-in. */
const appOrigins = subsystems.flatMap(({ slug }) => {
  const url = appUrl(slug);
  return url ? [new URL(url).origin] : [];
});

export function safeNext(value: unknown): string {
  return safeRedirectTarget(value, appOrigins, "/dashboard");
}
