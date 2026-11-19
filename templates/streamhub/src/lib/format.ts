import { NOW } from "@/data/seed-media";

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

export function formatCount(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export function timeAgo(iso: string) {
  const days = Math.max(0, Math.floor((NOW - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) {
    const hours = Math.max(1, Math.floor((NOW - new Date(iso).getTime()) / 3_600_000));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function approval(likes: number, dislikes: number) {
  const total = likes + dislikes;
  return total ? Math.round((likes / total) * 100) : 0;
}

/** Small seeded PRNG so generated art is identical on server and client. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
