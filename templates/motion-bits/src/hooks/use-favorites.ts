"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "motion-bits:favorites";
const EVENT = "motion-bits:favorites-change";
const EMPTY: string[] = [];

let cacheRaw: string | null = null;
let cacheList: string[] = EMPTY;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cacheList;
  cacheRaw = raw;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    cacheList = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : EMPTY;
  } catch {
    cacheList = EMPTY;
  }
  return cacheList;
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: keep working in memory for this tab */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Bookmarked component slugs, persisted in localStorage and safe during static/SSR render (empty on the server). */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);
  const toggle = useCallback((slug: string) => {
    const cur = read();
    write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  }, []);
  const remove = useCallback((slug: string) => write(read().filter((s) => s !== slug)), []);
  const clear = useCallback(() => write([]), []);

  return { favorites, isFavorite, toggle, remove, clear };
}
