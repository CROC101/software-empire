'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Clock3, Heart, ListPlus, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import type { TrackItem } from '@/types/spotify';
import { usePlayer, type PlayContext } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { fmtDate, fmtTime } from '@/lib/format';
import { albumHref, artistHref } from '@/lib/links';
import Cover from './Cover';
import EqualizerBars from './EqualizerBars';

interface Props {
  tracks: TrackItem[];
  context: PlayContext;
  showAlbum?: boolean;
  showDate?: boolean;
  showCover?: boolean;
  dates?: Record<string, string>;
  onReorder?: (ids: string[]) => void;
  onRemove?: (id: string) => void;
  /** number shown in the first column; defaults to position */
  numberOf?: (t: TrackItem, i: number) => number;
  header?: boolean;
  /** play queue: the whole list, rows only pick the start index */
  playList?: TrackItem[];
}

export default function TrackTable({ tracks, context, showAlbum = true, showDate, showCover = true, dates, onReorder, onRemove, numberOf, header = true, playList }: Props) {
  const p = usePlayer();
  const lib = useLibrary();
  const [menu, setMenu] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const cols = showAlbum && showDate ? 'md:grid-cols-[16px_6fr_4fr_3fr_minmax(120px,1fr)]' : showAlbum || showDate ? 'md:grid-cols-[16px_6fr_4fr_minmax(120px,1fr)]' : 'md:grid-cols-[16px_4fr_minmax(120px,1fr)]';
  const list = playList ?? tracks;

  const move = (from: number, to: number) => {
    if (!onReorder || to < 0 || to >= tracks.length || from === to) return;
    const ids = tracks.map((t) => t.id);
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    onReorder(ids);
  };

  return (
    <div role="grid" aria-label={context.name} className="text-sm text-subdued">
      {header && (
        <div className={`mb-2 hidden h-9 items-center gap-4 border-b border-white/10 px-4 md:grid ${cols}`}>
          <span className="text-right">#</span>
          <span>Title</span>
          {showAlbum && <span>Album</span>}
          {showDate && <span>Date added</span>}
          <span className="flex justify-end pr-8">
            <Clock3 size={16} aria-label="Duration" />
          </span>
        </div>
      )}
      {tracks.map((t, i) => {
        const current = p.isCurrent(t.id);
        const liked = lib.isLiked(t.id);
        return (
          <div
            key={`${t.id}-${i}`}
            role="row"
            draggable={!!onReorder}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => onReorder && e.preventDefault()}
            onDrop={() => {
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            onDoubleClick={() => p.playTracks(list, list.indexOf(t), context)}
            className={`group relative grid h-14 grid-cols-[1fr_auto] items-center gap-4 rounded-[4px] px-2 hover:bg-white/10 md:px-4 ${cols} ${drag === i ? 'opacity-50' : ''}`}
          >
            <button
              type="button"
              aria-label={current && p.isPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
              onClick={() => (current ? p.togglePlay() : p.playTracks(list, list.indexOf(t), context))}
              className="relative hidden h-4 w-4 items-center justify-end text-base md:flex"
            >
              {current && p.isPlaying ? (
                <EqualizerBars className="group-hover:hidden" />
              ) : (
                <span className={`tabular-nums group-hover:hidden ${current ? 'text-green' : ''}`}>{numberOf ? numberOf(t, i) : i + 1}</span>
              )}
              <Play size={14} fill="white" strokeWidth={0} className="hidden text-white group-hover:block" />
            </button>
            <div className="flex min-w-0 items-center gap-3" onClick={() => window.matchMedia('(max-width: 767px)').matches && p.playTracks(list, list.indexOf(t), context)}>
              {showCover && <Cover cover={t.cover} className="h-10 w-10 shrink-0 !rounded-[4px]" />}
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => p.playTracks(list, list.indexOf(t), context)}
                  className={`block max-w-full truncate text-left text-base leading-[22px] ${current ? 'text-green' : 'text-white'}`}
                >
                  {t.title}
                </button>
                <div className="flex items-center gap-1 truncate">
                  {t.explicit && <span className="grid h-4 w-4 shrink-0 place-items-center rounded-xs bg-white/60 text-[10px] font-bold text-black">E</span>}
                  {t.source === 'youtube' && <span className="shrink-0 rounded-xs bg-white/10 px-1 text-[10px] font-bold text-white">YT</span>}
                  <Link href={artistHref(t)} className="truncate hover:text-white hover:underline">
                    {t.artistName}
                  </Link>
                </div>
              </div>
            </div>
            {showAlbum && (
              <Link href={albumHref(t)} className="hidden truncate hover:text-white hover:underline md:block">
                {t.albumName}
              </Link>
            )}
            {showDate && <span className="hidden truncate md:block">{fmtDate(dates?.[t.id] ?? t.addedAt)}</span>}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                onClick={() => lib.toggleLike(t)}
                className={`${liked ? 'text-green' : 'text-subdued opacity-0 group-hover:opacity-100 hover:text-white'} hidden md:block`}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <span className="hidden w-10 text-right tabular-nums md:block">{fmtTime(t.duration)}</span>
              <button
                type="button"
                aria-label={`More options for ${t.title}`}
                onClick={() => setMenu(menu === t.id + i ? null : t.id + i)}
                className="text-subdued hover:text-white md:opacity-0 md:group-hover:opacity-100"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
            {menu === t.id + i && (
              <div role="menu" className="absolute right-4 top-12 z-30 w-56 rounded-[4px] bg-highlight p-1 text-sm text-white shadow-[0_16px_24px_rgba(0,0,0,.5)]" onMouseLeave={() => setMenu(null)}>
                <MenuItem icon={<ListPlus size={16} />} onClick={() => { p.addToQueue(t); setMenu(null); }}>Add to queue</MenuItem>
                <MenuItem icon={<Heart size={16} />} onClick={() => { lib.toggleLike(t); setMenu(null); }}>{liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</MenuItem>
                {onReorder && i > 0 && <MenuItem icon={<ArrowUp size={16} />} onClick={() => { move(i, i - 1); setMenu(null); }}>Move up</MenuItem>}
                {onReorder && i < tracks.length - 1 && <MenuItem icon={<ArrowDown size={16} />} onClick={() => { move(i, i + 1); setMenu(null); }}>Move down</MenuItem>}
                {onRemove && <MenuItem icon={<Trash2 size={16} />} onClick={() => { onRemove(t.id); setMenu(null); }}>Remove from this playlist</MenuItem>}
                <div className="my-1 border-t border-white/10" />
                <p className="px-3 py-1 text-xs text-subdued">Add to playlist</p>
                <div className="max-h-40 overflow-y-auto">
                  {lib.playlists.map((pl) => (
                    <MenuItem key={pl.id} onClick={() => { lib.addToPlaylist(pl.id, t.id); setMenu(null); }}>{pl.name}</MenuItem>
                  ))}
                </div>
                <div className="my-1 border-t border-white/10" />
                <Link href={artistHref(t)} className="block rounded-xs px-3 py-2 hover:bg-white/10">Go to artist</Link>
                <Link href={albumHref(t)} className="block rounded-xs px-3 py-2 hover:bg-white/10">Go to album</Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MenuItem({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-3 rounded-xs px-3 py-2 text-left hover:bg-white/10">
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
