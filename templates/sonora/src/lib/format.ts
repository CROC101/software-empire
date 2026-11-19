export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** "01:24" style used by the player scrubber */
export function fmtClock(sec: number): string {
  return fmtTime(sec).padStart(5, '0');
}

export function fmtTotal(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h} hr ${m} min` : `${m} min ${s} sec`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const fmtNumber = (n: number) => n.toLocaleString('en-US');
