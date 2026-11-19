'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Search, Shuffle } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import PlayButton from '@/components/ui/PlayButton';
import TrackTable from '@/components/ui/TrackTable';
import { ActionBand, DetailHero } from '@/components/ui/Hero';

const LIKED = '#5038a0';

export default function LikedSongsPage() {
  const lib = useLibrary();
  const p = usePlayer();
  const [filter, setFilter] = useState('');
  const href = '/collection/tracks';
  const here = p.context?.href === href;
  const all = [...lib.liked].sort((a, b) => b.at.localeCompare(a.at));
  const q = filter.trim().toLowerCase();
  const shown = q ? all.filter(({ track: t }) => `${t.title} ${t.artistName} ${t.albumName}`.toLowerCase().includes(q)) : all;
  const tracks = shown.map((x) => x.track);
  const ctx = { name: 'Liked Songs', href };

  return (
    <div className="pb-10">
      <DetailHero
        color={LIKED}
        kind="Playlist"
        title="Liked Songs"
        art={
          <div className="grid h-full w-full place-items-center rounded-img bg-[linear-gradient(135deg,#450af5,#c4efd9)] shadow-[0_4px_60px_rgba(0,0,0,.5)]">
            <Heart size={80} fill="white" stroke="white" />
          </div>
        }
      >
        <span className="font-bold text-white">You</span>
        <span>• {all.length} songs</span>
      </DetailHero>

      <ActionBand color={LIKED}>
        <PlayButton playing={here && p.isPlaying} onClick={() => (here ? p.togglePlay() : tracks.length && p.playTracks(tracks, 0, ctx))} />
        <button
          type="button"
          aria-label="Shuffle"
          onClick={() => {
            if (!p.shuffle) p.toggleShuffle();
            if (tracks.length) p.playTracks(tracks, Math.floor(Math.random() * tracks.length), ctx);
          }}
          className={p.shuffle && here ? 'text-green' : 'text-subdued hover:text-white'}
        >
          <Shuffle size={32} />
        </button>
        <label className="ml-auto flex h-8 w-40 items-center gap-2 rounded bg-white/10 px-2 text-subdued focus-within:w-56 sm:w-56">
          <Search size={16} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search in Liked Songs" aria-label="Search in Liked Songs" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-subdued" />
        </label>
      </ActionBand>

      <div className="px-2 md:px-6">
        {tracks.length ? (
          <TrackTable tracks={tracks} context={ctx} showDate dates={Object.fromEntries(shown.map((x) => [x.track.id, x.at]))} />
        ) : (
          <div className="py-16 text-center">
            <Heart size={48} className="mx-auto text-subdued" />
            <h2 className="mt-4 text-2xl font-bold">{q ? 'No songs match your filter' : 'Songs you like will appear here'}</h2>
            <p className="mt-2 text-subdued">Save songs by tapping the heart icon.</p>
            <Link href="/search" className="mt-6 inline-block h-12 rounded-full bg-white px-8 leading-[48px] font-bold text-black hover:scale-105">
              Find songs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
