'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { TrackItem } from '@/types/spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { fmtTime } from '@/lib/format';
import { artistHref } from '@/lib/links';
import Cover from '@/components/ui/Cover';
import EqualizerBars from '@/components/ui/EqualizerBars';

function Row({ t, onPlay, playing, extra }: { t: TrackItem; onPlay: () => void; playing?: boolean; extra?: React.ReactNode }) {
  return (
    <li className="group flex h-14 items-center gap-3 rounded px-2 hover:bg-white/10">
      <button type="button" onClick={onPlay} aria-label={`Play ${t.title}`} className="relative h-10 w-10 shrink-0">
        <Cover cover={t.cover} label={t.title} className="h-10 w-10" />
        {playing && (
          <span className="absolute inset-0 grid place-items-center bg-black/50">
            <EqualizerBars />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-base ${playing ? 'text-green' : ''}`}>{t.title}</p>
        <Link href={artistHref(t)} className="truncate text-sm text-subdued hover:text-white hover:underline">
          {t.artistName}
        </Link>
      </div>
      <span className="hidden min-w-0 flex-1 truncate text-sm text-subdued md:block">{t.albumName}</span>
      {extra}
      <span className="w-12 text-right text-sm tabular-nums text-subdued">{fmtTime(t.duration)}</span>
    </li>
  );
}

export default function QueuePage() {
  const p = usePlayer();
  const lib = useLibrary();
  const [tab, setTab] = useState<'queue' | 'recent'>('queue');
  const recent = p.history.map((id) => lib.trackById(id)).filter((t): t is TrackItem => !!t);
  const tabBtn = (k: typeof tab, label: string) => (
    <button type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-8 rounded-full px-3 text-sm ${tab === k ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
      {label}
    </button>
  );

  return (
    <div className="px-4 pb-10 pt-6 md:px-6">
      <div role="tablist" className="flex gap-2">
        {tabBtn('queue', 'Queue')}
        {tabBtn('recent', 'Recently played')}
      </div>

      {tab === 'queue' ? (
        <>
          <h1 className="mt-6 font-title text-2xl font-bold">Queue</h1>
          <h2 className="mt-6 text-base font-bold text-subdued">Now playing</h2>
          <ul className="mt-2">{p.track ? <Row t={p.track} playing={p.isPlaying} onPlay={p.togglePlay} /> : <li className="px-2 text-subdued">Nothing is playing.</li>}</ul>

          {p.userQueue.length > 0 && (
            <>
              <div className="mt-8 flex items-center justify-between">
                <h2 className="text-base font-bold text-subdued">Next in queue</h2>
                <button type="button" onClick={p.clearQueue} className="text-sm font-bold text-subdued hover:text-white hover:underline">
                  Clear queue
                </button>
              </div>
              <ul className="mt-2">
                {p.userQueue.map((t, i) => (
                  <Row
                    key={`${t.id}-${i}`}
                    t={t}
                    onPlay={() => p.playTrack(t)}
                    extra={
                      <span className="flex items-center gap-1 text-subdued md:opacity-0 md:group-hover:opacity-100">
                        <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => p.moveInQueue(i, -1)} className="p-1 hover:text-white disabled:opacity-30">
                          <ChevronUp size={18} />
                        </button>
                        <button type="button" aria-label="Move down" disabled={i === p.userQueue.length - 1} onClick={() => p.moveInQueue(i, 1)} className="p-1 hover:text-white disabled:opacity-30">
                          <ChevronDown size={18} />
                        </button>
                        <button type="button" aria-label="Remove from queue" onClick={() => p.removeFromQueue(i)} className="p-1 hover:text-white">
                          <X size={18} />
                        </button>
                      </span>
                    }
                  />
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-8 text-base font-bold text-subdued">
            Next from:{' '}
            {p.context ? (
              <Link href={p.context.href} className="text-white hover:underline">
                {p.context.name}
              </Link>
            ) : (
              'Autoplay'
            )}
          </h2>
          <ul className="mt-2">
            {p.upNext.length ? p.upNext.slice(0, 30).map((t, i) => <Row key={`${t.id}-${i}`} t={t} onPlay={() => p.playTracks(p.upNext, i, p.context ?? undefined)} />) : <li className="px-2 text-sm text-subdued">Nothing else lined up — autoplay will pick similar songs.</li>}
          </ul>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-title text-2xl font-bold">Recently played</h1>
          <ul className="mt-4">
            {recent.length ? recent.map((t, i) => <Row key={`${t.id}-${i}`} t={t} onPlay={() => p.playTrack(t)} />) : <li className="px-2 text-subdued">Songs you play will show up here.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
