import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// shortcut: no incremental cache (the free plan has no R2 without a card), so fetch caching is a
// no-op and every request reads Supabase directly; add a KV cache when traffic needs it
export default defineCloudflareConfig();
