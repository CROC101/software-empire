'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, ListMusic, Maximize2, Mic2, Minimize2, PanelRight, SlidersHorizontal, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { albumHref, artistHref } from '@/lib/links';
import Cover from '@/components/ui/Cover';
import { Scrubber, TransportButtons } from './Controls';

export default function PersistentPlayerBar({ panelOpen, onPanel }: { panelOpen: boolean; onPanel: () => void }) {
  const p = usePlayer();
  const lib = useLibrary();
  const path = usePathname();
  const [full, setFull] = useState(false);
  const t = p.track;

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const vol = p.muted ? 0 : p.volume;
  const VolIcon = vol === 0 ? VolumeX : vol < 0.34 ? Volume : vol < 0.67 ? Volume1 : Volume2;
  const iconBtn = (active: boolean) => `relative grid h-8 w-8 place-items-center ${active ? 'text-green' : 'text-subdued hover:text-white'}`;

  return (
    <aside aria-label="Now playing bar" className="order-last mx-2 mb-2 hidden h-player shrink-0 grid-cols-[minmax(180px,1fr)_minmax(320px,722px)_minmax(180px,1fr)] items-center gap-2 md:grid">
      <div className="flex min-w-0 items-center gap-3 pl-4">
        {t && (
          <>
            <Link href={albumHref(t)} aria-label={`Album: ${t.albumName}`}>
              <Cover cover={t.cover} className="h-14 w-14 !rounded-[4px]" />
            </Link>
            <div className="min-w-0">
              <Link href={albumHref(t)} className="block truncate text-sm text-white hover:underline">
                {t.title}
              </Link>
              <Link href={artistHref(t)} className="block truncate text-xs text-subdued hover:text-white hover:underline">
                {t.artistName}
              </Link>
            </div>
            <button type="button" aria-label={lib.isLiked(t.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs'} onClick={() => lib.toggleLike(t)} className={`ml-2 shrink-0 ${lib.isLiked(t.id) ? 'text-green' : 'text-subdued hover:text-white'}`}>
              <Heart size={16} fill={lib.isLiked(t.id) ? 'currentColor' : 'none'} />
            </button>
          </>
        )}
      </div>

      <div className="flex w-full max-w-[722px] flex-col items-center gap-1 justify-self-center">
        <TransportButtons />
        <Scrubber />
      </div>

      <div className="flex items-center justify-end gap-1 pr-4">
        <button type="button" aria-label="Now playing view" onClick={onPanel} className={`${iconBtn(panelOpen)} max-lg:hidden`}>
          <PanelRight size={16} />
        </button>
        <Link href="/lyrics" aria-label="Lyrics" className={iconBtn(path.startsWith('/lyrics'))}>
          <Mic2 size={16} />
        </Link>
        <Link href="/queue" aria-label="Queue" className={iconBtn(path.startsWith('/queue'))}>
          <ListMusic size={16} />
        </Link>
        <Link href="/account#equalizer" aria-label="Equalizer" className={iconBtn(p.preset !== 'Flat')}>
          <SlidersHorizontal size={16} />
        </Link>
        <button type="button" aria-label={p.muted ? 'Unmute' : 'Mute'} onClick={p.toggleMute} className={iconBtn(false)}>
          <VolIcon size={16} />
        </button>
        <input
          type="range"
          className="bar w-[93px]"
          aria-label="Change volume"
          min={0}
          max={1}
          step={0.01}
          value={vol}
          onChange={(e) => p.setVolume(Number(e.target.value))}
          style={{ '--fill': `${vol * 100}%` } as React.CSSProperties}
        />
        <button
          type="button"
          aria-label={full ? 'Exit full screen' : 'Full screen'}
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => undefined)}
          className={iconBtn(false)}
        >
          {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </aside>
  );
}
