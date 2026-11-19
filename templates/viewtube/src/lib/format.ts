export function compact(n: number): string {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

export function timeAgo(isoDate: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(isoDate).getTime()) / 1000;
  const units: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(diff / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function fullDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
