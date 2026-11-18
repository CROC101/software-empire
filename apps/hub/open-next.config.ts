import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssets from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Pages prerendered at build (the home page above all) are served from the static assets without
// rendering: Workers Free allows 10 ms CPU per request and rendering the home page took 100+ ms
// (error 1102). Fetch results are never served from there, so the site switches the admins save
// at /admin/system stay live on every other page.
// Inherits from the instance (its name tells the deploy step to copy the pages into the assets).
// shortcut: prerendered pages change only on the next deploy; add a KV cache when they must refresh sooner
const pagesOnly = Object.create(staticAssets) as typeof staticAssets;
pagesOnly.get = (key, cacheType) =>
  cacheType === "fetch" ? Promise.resolve(null) : staticAssets.get(key, cacheType);

export default defineCloudflareConfig({
  incrementalCache: pagesOnly,
  // answer prerendered pages before the Next server even loads
  enableCacheInterception: true,
});
