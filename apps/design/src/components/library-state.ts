"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { initialView, parseView, viewHash, type View } from "@/lib/library";

/* ---------- gallery view in the URL hash (shareable, back button keeps it) ---------- */

const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
  };
};

export function useView(): [View, (patch: Partial<View>) => void] {
  const hash = useSyncExternalStore(
    onHash,
    () => window.location.hash,
    () => "",
  );
  const view = useMemo(() => (hash ? parseView(hash) : initialView), [hash]);
  const set = useCallback(
    (patch: Partial<View>) => {
      const next = viewHash({ ...view, ...patch });
      history.replaceState(null, "", next || window.location.pathname);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [view],
  );
  return [view, set];
}

/* ---------- favourites: slugs only, per browser (no account needed) ---------- */

const KEY = "design-favs";
const EVENT = "design-favs";
const none: ReadonlySet<string> = new Set();
let cache: { raw: string | null; set: ReadonlySet<string> } = { raw: null, set: none };

function read(): ReadonlySet<string> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return none;
  }
  if (raw === cache.raw) return cache.set;
  let set = none;
  try {
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list))
      set = new Set(
        list.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,40}$/.test(s)),
      );
  } catch {
    set = none;
  }
  cache = { raw, set };
  return set;
}

const onFavs = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};

export function useFavs(): [ReadonlySet<string>, (slug: string) => void] {
  const favs = useSyncExternalStore(onFavs, read, () => none);
  const toggle = useCallback((slug: string) => {
    const next = new Set(read());
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [favs, toggle];
}
