'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Music2 } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useCoverColor } from '@/components/ui/Hero';

export default function LyricsPage() {
  const p = usePlayer();
  const t = p.track;
  const color = useCoverColor(t?.cover);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Seed lyric times assume the catalogue duration; stretch them to the real file length.
  const scale = t && p.duration > 0 && t.source === 'catalog' ? p.duration / t.duration : 1;
  const active = t ? t.lyrics.findLastIndex((l) => l.time * scale <= p.currentTime) : -1;

  useEffect(() => {
    lineRefs.current[active]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [active]);

  if (!t) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <Music2 size={48} className="mx-auto text-subdued" />
          <h1 className="mt-4 text-2xl font-bold">Play a song to see its lyrics</h1>
          <Link href="/" className="mt-6 inline-block h-12 rounded-full bg-white px-8 font-bold leading-[48px] text-black">
            Browse music
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 pb-24 pt-10 transition-colors duration-700 md:px-16 md:pt-16" style={{ backgroundColor: color }}>
      <p className="text-sm font-bold text-black/60">
        {t.title} · {t.artistName}
      </p>
      <div className="mt-6 flex max-w-[780px] flex-col items-start gap-2">
        {t.lyrics.map((l, i) => (
          <button
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            type="button"
            onClick={() => p.seek(l.time * scale)}
            className={`text-left font-title text-2xl font-bold leading-snug tracking-[-0.02em] transition-colors hover:underline md:text-[32px] ${
              i === active ? 'text-white' : i < active ? 'text-white/60' : 'text-black/70'
            }`}
          >
            {l.text}
          </button>
        ))}
      </div>
      <p className="mt-10 text-sm text-black/60">Lyrics written for this demo · tap a line to jump there</p>
    </div>
  );
}
