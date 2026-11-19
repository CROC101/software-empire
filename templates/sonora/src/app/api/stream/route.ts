import { FALLBACK_STREAMS, MUSIC_CREDIT, TRACKS } from '@/data/seed-spotify';

// Pre-built stream manifest: every catalogue song's CORS-safe file, plus the rule the player
// follows when a stream fails (render a synthesized ambient track in the browser).
export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    credit: MUSIC_CREDIT,
    fallback: { kind: 'synth', how: 'Web Audio OfflineAudioContext pad seeded from the track id' },
    streams: Object.fromEntries(TRACKS.map((t) => [t.id, { src: t.src, duration: t.duration, cors: true }])),
    pool: FALLBACK_STREAMS,
  });
}
