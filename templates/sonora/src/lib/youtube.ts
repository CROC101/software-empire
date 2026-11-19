import type { TrackItem } from '@/types/spotify';
import { TRACKS } from '@/data/seed-spotify';
import { hashSeed } from './synth';

/**
 * YouTube resolver that runs in the browser (the site is a static export, so the
 * /api routes are pre-rendered JSON and the live lookups happen here):
 * metadata via noembed (oEmbed, CORS-enabled), search + audio via public Piped mirrors,
 * curated catalog fallback, and a synthesized ambient render when no stream is reachable.
 */
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://api.piped.private.coffee'];
const ID_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|music\.youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/;

export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  const m = s.match(ID_RE);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(s) && /\d|[A-Z_-]/.test(s) ? s : null;
}

async function getJson<T>(url: string, ms = 4500): Promise<T | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function firstPiped<T>(path: string): Promise<T | null> {
  for (const base of PIPED) {
    const j = await getJson<T>(base + path);
    if (j) return j;
  }
  return null;
}

interface PipedStreams {
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnailUrl?: string;
  audioStreams?: { url: string; bitrate: number; mimeType: string }[];
}

/** Playable audio for a video id, or a synth: placeholder the player renders locally. */
export async function resolveStream(id: string): Promise<{ src: string; live: boolean; meta?: PipedStreams }> {
  const s = await firstPiped<PipedStreams>(`/streams/${id}`);
  const best = s?.audioStreams?.filter((a) => a.url).sort((a, b) => b.bitrate - a.bitrate)[0];
  return best ? { src: best.url, live: true, meta: s ?? undefined } : { src: `synth:${hashSeed(id)}`, live: false, meta: s ?? undefined };
}

export function makeImportedTrack(p: { id: string; title: string; author: string; duration?: number; thumb?: string; src: string }): TrackItem {
  const seed = hashSeed(p.id);
  const hue = seed % 360;
  const duration = p.duration && p.duration > 0 ? p.duration : 90;
  return {
    id: `yt-${p.id}`,
    title: p.title,
    artistId: 'youtube',
    artistName: p.author || 'YouTube',
    albumId: 'youtube-imports',
    albumName: 'Imported From YouTube',
    duration,
    src: p.src,
    cover: { color: `hsl(${hue} 55% 38%)`, accent: `hsl(${(hue + 140) % 360} 80% 70%)`, image: p.thumb },
    genres: ['youtube'],
    lyrics: [
      { time: 0, text: `♪ ${p.title}` },
      { time: duration * 0.25, text: 'Lyrics are not available for imported tracks' },
      { time: duration * 0.5, text: `Imported from YouTube · ${p.author || 'Unknown channel'}` },
      { time: duration * 0.75, text: '♪' },
    ],
    addedAt: new Date().toISOString(),
    source: 'youtube',
    youtubeId: p.id,
  };
}

/** Resolves a pasted link or a search query into importable tracks. */
export async function searchYouTube(input: string): Promise<{ tracks: TrackItem[]; mode: 'link' | 'search' | 'fallback' }> {
  const id = parseYouTubeId(input);
  if (id) {
    const [meta, stream] = await Promise.all([
      getJson<{ title?: string; author_name?: string; thumbnail_url?: string; error?: string }>(
        `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`,
      ),
      resolveStream(id),
    ]);
    const title = meta?.title ?? stream.meta?.title ?? `YouTube video ${id}`;
    return {
      mode: 'link',
      tracks: [
        makeImportedTrack({
          id,
          title,
          author: meta?.author_name ?? stream.meta?.uploader ?? 'YouTube',
          duration: stream.meta?.duration,
          thumb: meta?.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          src: stream.src,
        }),
      ],
    };
  }

  const q = input.trim();
  const found = await firstPiped<{ items?: { url: string; title: string; uploaderName?: string; duration?: number; thumbnail?: string }[] }>(
    `/search?q=${encodeURIComponent(q)}&filter=music_songs`,
  );
  const items = (found?.items ?? []).filter((i) => i.url?.includes('v=')).slice(0, 6);
  if (items.length)
    return {
      mode: 'search',
      tracks: items.map((i) => {
        const vid = i.url.split('v=')[1].slice(0, 11);
        // stream is resolved lazily when the track is imported
        return makeImportedTrack({ id: vid, title: i.title, author: i.uploaderName ?? 'YouTube', duration: i.duration, thumb: i.thumbnail, src: `pending:${vid}` });
      }),
    };

  return { mode: 'fallback', tracks: curatedFallback(q) };
}

/** Rate-limited or offline: catalog matches first, then a synthesized render named after the query. */
export function curatedFallback(q: string): TrackItem[] {
  const needle = q.toLowerCase();
  const hits = TRACKS.filter((t) => `${t.title} ${t.artistName} ${t.genres.join(' ')}`.toLowerCase().includes(needle)).slice(0, 4);
  const seed = hashSeed(q || 'ambient');
  const synth = makeImportedTrack({ id: `synth${seed}`.slice(0, 16), title: q ? `${q} (Ambient Render)` : 'Ambient Render', author: 'Sonora Synth', duration: 90, src: `synth:${seed}` });
  return [...hits.map((t) => ({ ...t, id: `yt-cat-${t.id}`, source: 'youtube' as const, albumId: 'youtube-imports', albumName: 'Imported From YouTube', addedAt: new Date().toISOString() })), synth];
}
