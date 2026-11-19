'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Shuffle, X } from 'lucide-react';
import { ALBUMS, ARTISTS, getArtist, TRACKS } from '@/data/seed-spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { fmtNumber } from '@/lib/format';
import PlayButton from '@/components/ui/PlayButton';
import TrackTable from '@/components/ui/TrackTable';
import Shelf from '@/components/ui/Shelf';
import { AlbumCard, ArtistCard } from '@/components/ui/Cards';

const TABS = ['Popular releases', 'Albums', 'Singles and EPs'] as const;

export default function ArtistView({ id }: { id: string }) {
  const a = getArtist(id)!;
  const p = usePlayer();
  const lib = useLibrary();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Popular releases');
  const [about, setAbout] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const href = `/artist/${id}`;
  const here = p.context?.href === href;
  const following = lib.isFollowing(id);
  const popular = TRACKS.filter((t) => t.artistId === id).sort((x, y) => y.duration - x.duration);
  const albums = ALBUMS.filter((al) => al.artistId === id);
  const releases = tab === 'Albums' ? albums.filter((al) => al.type === 'Album') : tab === 'Singles and EPs' ? albums.filter((al) => al.type !== 'Album') : albums;

  return (
    <div className="pb-10">
      <header className="relative flex h-[300px] items-end overflow-hidden md:h-[340px]">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 75% 30%, ${a.cover.accent} 0%, transparent 45%), linear-gradient(135deg, ${a.cover.color} 0%, #121212 110%)` }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,.55)_100%)]" />
        <div className="relative px-4 pb-6 md:px-6">
          <p className="flex items-center gap-2 text-sm text-white">
            <BadgeCheck size={24} className="text-[#4cb3ff]" fill="white" stroke="#4cb3ff" /> Verified Artist
          </p>
          <h1 className="mt-2 font-title text-[48px] font-extrabold leading-none tracking-[-0.04em] md:text-hero">{a.name}</h1>
          <p className="mt-4 text-base text-white">{fmtNumber(a.monthlyListeners)} monthly listeners</p>
        </div>
      </header>

      <div className="relative bg-[linear-gradient(180deg,rgba(0,0,0,.35),#121212_232px)]" style={{ backgroundColor: a.cover.color }}>
        <div className="flex items-center gap-6 px-4 py-6 md:px-6">
          <PlayButton playing={here && p.isPlaying} onClick={() => (here ? p.togglePlay() : p.playTracks(popular, 0, { name: a.name, href }))} />
          <button type="button" aria-label="Shuffle play" onClick={() => { if (!p.shuffle) p.toggleShuffle(); p.playTracks(popular, Math.floor(Math.random() * popular.length), { name: a.name, href }); }} className={p.shuffle && here ? 'text-green' : 'text-subdued hover:text-white'}>
            <Shuffle size={28} />
          </button>
          <button type="button" aria-pressed={following} onClick={() => lib.toggleFollow(id)} className="h-8 rounded-full border border-white/50 px-4 text-sm font-bold hover:scale-105 hover:border-white">
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        <section className="px-2 md:px-6">
          <h2 className="px-2 font-title text-2xl font-bold">Popular</h2>
          <div className="mt-4">
            <TrackTable tracks={popular.slice(0, showAll ? 10 : 5)} playList={popular} context={{ name: a.name, href }} showAlbum={false} header={false} />
          </div>
          {popular.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-4 px-4 text-sm font-bold text-subdued hover:text-white">
              {showAll ? 'Show less' : 'See more'}
            </button>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="px-4 font-title text-2xl font-bold md:px-6">Discography</h2>
        <div role="tablist" className="mt-4 flex gap-2 px-4 md:px-6">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`h-8 rounded-full px-3 text-sm ${tab === t ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 px-1 sm:grid-cols-3 md:px-3 lg:grid-cols-4 xl:grid-cols-5">
          {releases.length ? releases.map((al) => <AlbumCard key={al.id} a={al} showArtist={false} />) : <p className="col-span-full px-3 py-6 text-subdued">Nothing here yet.</p>}
        </div>
      </section>

      <section className="mt-10 px-4 md:px-6">
        <h2 className="font-title text-2xl font-bold">About</h2>
        <button type="button" onClick={() => setAbout(true)} className="mt-4 block w-full max-w-[672px] overflow-hidden rounded-lg text-left transition hover:scale-[1.01]">
          <div className="relative h-[280px] p-6 md:h-[380px] md:p-10" style={{ background: `linear-gradient(160deg, ${a.cover.accent} 0%, ${a.cover.color} 55%, #121212 100%)` }}>
            <span className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10">
              <span className="block text-base font-bold">{fmtNumber(a.monthlyListeners)} monthly listeners</span>
              <span className="mt-2 line-clamp-3 block text-base text-white/90">{a.bio}</span>
            </span>
          </div>
        </button>
      </section>

      <div className="mt-10 mx-auto max-w-[1955px] px-4 md:px-10">
        <Shelf title="Fans also like" href="/section/popular-artists">
          {ARTISTS.filter((x) => x.id !== id).map((x) => (
            <ArtistCard key={x.id} a={x} fixed />
          ))}
        </Shelf>
      </div>

      <AnimatePresence>
        {about && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setAbout(false)}>
            <motion.div
              role="dialog"
              aria-label={`About ${a.name}`}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-[720px] overflow-y-auto rounded-lg bg-elevated"
            >
              <button type="button" aria-label="Close" onClick={() => setAbout(false)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50">
                <X size={18} />
              </button>
              <div className="h-56" style={{ background: `linear-gradient(135deg, ${a.cover.color}, ${a.cover.accent})` }} />
              <div className="flex flex-col gap-4 p-6 md:flex-row md:gap-10 md:p-10">
                <div className="shrink-0">
                  <p className="text-3xl font-bold">{fmtNumber(a.monthlyListeners)}</p>
                  <p className="text-sm text-subdued">Monthly listeners</p>
                  <p className="mt-4 text-sm font-bold">{a.city}</p>
                  <p className="text-sm text-subdued">{fmtNumber(Math.round(a.monthlyListeners / 37))} listeners</p>
                </div>
                <p className="text-base leading-7 text-subdued">{a.bio}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
