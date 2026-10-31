import "server-only";
import { readCms, resolveCms, type CmsPage } from "@empire/core/cms";
import { env } from "@/lib/env";

/**
 * One page's content, edited at the hub's /admin. The hub's save only clears the hub's own cache,
 * so here an edit shows within a minute; the defaults in code show if the database is down.
 */
export async function getContent(page: CmsPage) {
  const rows = await readCms(env, page.app, page.page, {
    next: { revalidate: 60, tags: ["cms"] },
  });
  return resolveCms(page, rows);
}
