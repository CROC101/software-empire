import { createBrowserSupabase } from "@empire/core/supabase";
import { env } from "./env";

/** Reads and refreshes the session cookie the hub set — one sign-in covers every Empire app. */
export const supabase = createBrowserSupabase(env.supabase);

export const ASSET_BUCKET = "canva-assets";

/** Stable public URL of an uploaded file — saved inside design JSON, so it must never expire. */
export function assetContentUrl(assetId: string): string {
  return `${env.supabase.url}/storage/v1/object/public/${ASSET_BUCKET}/${assetId}`;
}
