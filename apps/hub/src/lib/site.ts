import "server-only";
import { LAUNCH_AT } from "@empire/core/launch";
import { z } from "zod";
import { env } from "@/lib/env";

/** Cache tag of the site switches; every admin save at /admin/system calls updateTag(SITE_TAG). */
export const SITE_TAG = "site";

const settingsRow = z.object({
  launch_at: z.string(),
  soon_message: z.string(),
  announcement: z.string(),
});
export type SiteSettings = z.infer<typeof settingsRow>;

const appRow = z.object({
  slug: z.string(),
  status: z.enum(["open", "maintenance", "off"]),
  message: z.string(),
  login: z.boolean(),
});
export type AppSwitch = z.infer<typeof appRow>;

const FALLBACK: SiteSettings = {
  launch_at: new Date(LAUNCH_AT).toISOString(),
  soon_message: "",
  announcement: "",
};

/** Public rows of hub.settings / hub.apps, cached until an admin saves; null when unreachable. */
async function readHub(table: "settings" | "apps", select: string): Promise<unknown> {
  try {
    const res = await fetch(`${env.url}/rest/v1/${table}?select=${select}`, {
      cache: "force-cache",
      next: { tags: [SITE_TAG] },
      headers: { apikey: env.publishableKey, "Accept-Profile": "hub" },
      signal: AbortSignal.timeout(1500),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = z
    .array(settingsRow)
    .safeParse(await readHub("settings", "launch_at,soon_message,announcement"));
  return (rows.success && rows.data[0]) || FALLBACK;
}

export async function getApps(): Promise<AppSwitch[]> {
  const rows = z.array(appRow).safeParse(await readHub("apps", "slug,status,message,login"));
  return rows.success ? rows.data : [];
}

/** Has this moment (ISO) passed? Kept out of components: render must stay pure. */
export const passed = (iso: string, now = Date.now()) => now >= Date.parse(iso);

/** "1 มกราคม 2570" in Thai time, from an ISO timestamp. */
export const thaiDate = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeZone: "Asia/Bangkok" }).format(
    new Date(iso),
  );
