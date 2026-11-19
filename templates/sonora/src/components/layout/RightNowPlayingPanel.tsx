'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { getArtist } from '@/data/seed-spotify';
import { albumHref, artistHref } from '@/lib/links';
import { fmtNumber } from '@/lib/format';
import Cover from '@/components/ui/Cover';
import { useCoverColor } from '@/components/ui/Hero';

export default function RightNowPlayingPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.track;
  const color = useCoverColor(t?.cover);
  const artist = t ? getArtist(t.artistId) : undefined;
  const next = p.userQueue[0] ?? p.upNext[0];

  if (!open)
    return (
      <aside aria-label="Now playing view" className="relative hidden w-10 shrink-0 rounded-lg bg-surface xl:block">
        <button type="button" aria-label="Open Now Playing view" onClick={onToggle} className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center text-subdued hover:text-white">
          <ChevronLeft size={20} />
        </button>
      </aside>
    );

  return (
    <aside aria-label="Now playing view" className="relative hidden w-[300px] shrink-0 flex-col overflow-y-auto rounded-lg bg-surface md:flex xl:w-[320px]">
      <div className="absolute inset-x-0 top-0 h-[420px] transition-colors duration-700" style={{ background: `linear-gradient(180deg, ${color} 0%, #121212 100%)` }} />
      <div className="relative flex items-center justify-between p-4">
        <Link href={p.context?.href ?? '/queue'} className="truncate text-base font-bold hover:underline">
          {p.context?.name ?? 'Now playing'}
        </Link>
        <button type="button" aria-label="Close Now Playing view" onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-full text-subdued hover:bg-white/10 hover:text-white">
          <ChevronRight size={20} />
        </button>
      </div>
      {t && (
        <div className="relative px-4">
          <Link href={albumHref(t)}>
            <Cover cover={t.cover} label={t.albumName} big className="aspect-square w-full" />
          </Link>
          <div className="mt-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={albumHref(t)} className="block truncate text-2xl font-bold hover:underline">
                {t.title}
              </Link>
              <Link href={artistHref(t)} className="block truncate text-base text-subdued hover:text-white hover:underline">
                {t.artistName}
              </Link>
            </div>
            <button type="button" aria-label="Like" onClick={() => lib.toggleLike(t)} className={lib.isLiked(t.id) ? 'text-green' : 'text-subdued hover:text-white'}>
              <Heart size={20} fill={lib.isLiked(t.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          {p.sourceKind === 'ambient' && <p className="mt-2 rounded-[4px] bg-white/10 px-2 py-1 text-xs text-subdued">Stream unavailable — playing a synthesized ambient version.</p>}
        </div>
      )}
      {artist && (
        <Link href={`/artist/${artist.id}`} className="relative mx-4 mt-6 block overflow-hidden rounded-lg bg-elevated hover:bg-hover">
          <div className="h-36" style={{ background: `linear-gradient(135deg, ${artist.cover.color}, ${artist.cover.accent})` }} />
          <div className="p-4">
            <p className="text-base font-bold">About the artist</p>
            <p className="mt-1 text-base font-bold">{artist.name}</p>
            <p className="text-sm text-subdued">{fmtNumber(artist.monthlyListeners)} monthly listeners</p>
            <p className="mt-2 line-clamp-3 text-sm text-subdued">{artist.bio}</p>
          </div>
        </Link>
      )}
      <div className="relative mx-4 my-6 rounded-lg bg-elevated p-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold">Next in queue</p>
          <Link href="/queue" className="text-sm font-bold text-subdued hover:underline">
            Open queue
          </Link>
        </div>
        {next ? (
          <button type="button" onClick={() => p.next()} className="mt-3 flex w-full items-center gap-3 rounded-[6px] p-1 text-left hover:bg-white/10">
            <Cover cover={next.cover} className="h-12 w-12 !rounded-[4px]" />
            <span className="min-w-0">
              <span className="block truncate text-base">{next.title}</span>
              <span className="block truncate text-sm text-subdued">{next.artistName}</span>
            </span>
          </button>
        ) : (
          <p className="mt-3 text-sm text-subdued">Nothing queued. Autoplay will keep the music going.</p>
        )}
      </div>
    </aside>
  );
}
