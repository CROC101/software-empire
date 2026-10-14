import { useCallback, useSyncExternalStore } from "react";

/// รายการโปรดและเครื่องมือที่ใช้ล่าสุด — เก็บในเบราว์เซอร์ของผู้ใช้เท่านั้น (ความสะดวกส่วนตัว ไม่ใช่ข้อมูลสำคัญ)
/// เก็บแค่ slug ของเครื่องมือ ไม่มีสิ่งที่ผู้ใช้กรอก · localStorage ใช้ไม่ได้ (โหมดส่วนตัว) ก็ทำงานต่อได้แค่ไม่จำ

const FAVORITES_KEY = "empire-toolboxes:favorites";
const RECENT_KEY = "empire-toolboxes:recent";
const RECENT_MAX = 12;
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  let raw: string | null;

  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY;
  }

  const hit = cache.get(key);

  if (hit && hit.raw === raw) return hit.value;

  let value: string[];

  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    value = Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, 200)
      : EMPTY;
  } catch {
    value = EMPTY;
  }

  cache.set(key, { raw, value });

  return value;
}

function write(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ที่เก็บเต็มหรือถูกบล็อก — ไม่จำ แต่ไม่ทำให้หน้าพัง
  }

  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_KEY || event.key === RECENT_KEY) listener();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = () => EMPTY;

/// ผู้ใช้ที่ล็อกอิน: ทุกการกดดาวถูกส่งต่อไปที่ฐานข้อมูลด้วย (ตั้งโดย FavoritesSync) · ไม่ล็อกอิน = null
let remote: ((slug: string, on: boolean) => void) | null = null;

export function setFavoritesRemote(fn: typeof remote) {
  remote = fn;
}

export const readFavorites = () => read(FAVORITES_KEY);
export const replaceFavorites = (slugs: string[]) => {
  write(FAVORITES_KEY, slugs);
};

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, () => read(FAVORITES_KEY), serverSnapshot);
  const toggle = useCallback((slug: string) => {
    const current = read(FAVORITES_KEY);
    const on = !current.includes(slug);

    write(FAVORITES_KEY, on ? [slug, ...current] : current.filter((s) => s !== slug));
    remote?.(slug, on);
  }, []);

  return { favorites, toggle, isFavorite: (slug: string) => favorites.includes(slug) };
}

export function useRecent() {
  const recent = useSyncExternalStore(subscribe, () => read(RECENT_KEY), serverSnapshot);
  const clear = useCallback(() => write(RECENT_KEY, []), []);

  return { recent, clear };
}

export function rememberRecent(slug: string) {
  const current = read(RECENT_KEY);

  if (current[0] === slug) return;
  write(RECENT_KEY, [slug, ...current.filter((s) => s !== slug)].slice(0, RECENT_MAX));
}
