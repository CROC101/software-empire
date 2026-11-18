const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];
const rtf = new Intl.RelativeTimeFormat("th", { numeric: "auto" });

/** "3 วันที่ผ่านมา" style age of an ISO date; empty when the date cannot be read. */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, (now - then) / 1000);
  for (const [unit, size] of STEPS) if (s >= size) return rtf.format(-Math.floor(s / size), unit);
  return "เมื่อสักครู่";
}

/** 754 -> "12:34", 3725 -> "1:02:05". */
export function clock(seconds: number): string {
  const t = Math.max(0, Math.round(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
