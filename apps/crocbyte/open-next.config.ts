import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// every page is dynamic (force-dynamic in layout), so no incremental cache is needed
export default defineCloudflareConfig();
