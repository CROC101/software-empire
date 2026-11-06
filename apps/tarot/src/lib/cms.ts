import { readCms, resolveCms, type CmsPage, type CmsRow } from "@empire/core/cms";
import { useEffect, useMemo, useState } from "react";

/**
 * A page's CMS content (edited at the hub's /admin). Starts from the defaults in code, so the
 * first paint never waits or shows blanks; the owner's edits swap in once the fetch lands.
 */
export function useCmsContent(page: CmsPage) {
  const [rows, setRows] = useState<CmsRow[]>([]);
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) return;
    let live = true;
    void readCms({ url, publishableKey }, page.app, page.page).then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, [page]);
  return useMemo(() => resolveCms(page, rows), [page, rows]);
}
