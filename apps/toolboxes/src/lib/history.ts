/**
 * What this browser opened and downloaded in Toolboxes: tools, apps (/apps/*), craft apps (/craft/*).
 * Ids are catalogue ids (tool slug, app-<slug>, craft-<slug>). No React here: the cloud-save
 * bundle that runs inside /apps and /craft pages writes visits too.
 * shortcut: kept in this browser only; move to toolboxes.history (RLS) when the owner wants it per account.
 */

export type Visit = { id: string; act: "open" | "download"; at: number };

const KEY = "empire-toolboxes:history";
const MAX = 300;
const EMPTY: Visit[] = [];
let cache: { raw: string | null; value: Visit[] } = { raw: null, value: EMPTY };
const listeners = new Set<() => void>();

const isVisit = (v: unknown): v is Visit =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Visit).id === "string" &&
  ((v as Visit).act === "open" || (v as Visit).act === "download") &&
  Number.isFinite((v as Visit).at);

export function readHistory(): Visit[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.value;
  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter(isVisit).slice(0, MAX);
  } catch {
    // broken entry: start over
  }
  cache = { raw, value };
  return value;
}

function write(value: Visit[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage full or blocked: forget, never break the page
  }
  for (const l of listeners) l();
}

/** Logs a visit; opening the same thing again within 30 minutes only moves it to the top. */
export function logVisit(id: string, act: Visit["act"] = "open", now = Date.now()) {
  const list = readHistory();
  const same = list.findIndex((v) => v.id === id && v.act === act);
  const rest = same >= 0 && now - list[same].at < 30 * 60_000 ? list.toSpliced(same, 1) : list;
  write([{ id, act, at: now }, ...rest].slice(0, MAX));
}

export const clearHistory = () => write([]);

export function subscribeHistory(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
