import { TRACKS } from '@/data/seed-spotify';

// Static export has no server, so this is pre-built JSON: the offline catalogue that YouTube
// search falls back to. Live lookups run in the browser (src/lib/youtube.ts).
export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    mode: 'fallback',
    note: 'Live search runs in the browser through public mirrors; this list is used when they are unreachable.',
    tracks: TRACKS.map((t) => ({ id: t.id, title: t.title, artist: t.artistName, duration: t.duration, genres: t.genres, src: t.src })),
  });
}
