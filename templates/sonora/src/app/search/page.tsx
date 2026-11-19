'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, MonitorPlay, Search } from 'lucide-react';
import type { TrackItem } from '@/types/spotify';
import { ALBUMS, ARTISTS, GENRES, PODCAST_HUB } from '@/data/seed-spotify';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { searchYouTube } from '@/lib/youtube';
import TrackTable from '@/components/ui/TrackTable';
import Cover from '@/components/ui/Cover';
import { AlbumCard, ArtistCard, PlaylistCard } from '@/components/ui/Cards';
import { CategoryTile } from '@/components/views/GenreView';

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const lib = useLibrary();
  const p = usePlayer();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const [yt, setYt] = useState<{ tracks: TrackItem[]; mode: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => setText(q), [q]);

  const needle = q.trim().toLowerCase();
  const res = useMemo(() => {
    if (!needle) return null;
    const has = (s: string) => s.toLowerCase().includes(needle);
    return {
      tracks: lib.allTracks.filter((t) => has(t.title) || has(t.artistName) || has(t.albumName) || t.genres.some(has) || (t.tags ?? []).some(has)),
      artists: ARTISTS.filter((a) => has(a.name)),
      albums: ALBUMS.filter((a) => has(a.title) || has(ARTISTS.find((x) => x.id === a.artistId)?.name ?? '')),
      playlists: lib.playlists.filter((pl) => has(pl.name) || has(pl.description)),
    };
  }, [needle, lib.allTracks, lib.playlists]);

  const go = (v: string) => router.replace(v.trim() ? `/search/?q=${encodeURIComponent(v.trim())}` : '/search/');
  const fetchYt = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      setYt(await searchYouTube(q));
    } finally {
      setBusy(false);
    }
  };
  const addAll = (tracks: TrackItem[]) => {
    const fresh = tracks.filter((t) => !lib.trackById(t.id));
    lib.importTracks(fresh);
    setAdded((a) => [...a, ...tracks.map((t) => t.id)]);
  };

  return (
    <div className="px-4 pb-10 pt-4 md:px-6">
      <form
        className="lg:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
      >
        <label className="flex h-12 items-center gap-3 rounded-full bg-elevated px-4 text-subdued focus-within:ring-2 focus-within:ring-white">
          <Search size={22} />
          <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text !== q && go(text)} placeholder="What do you want to play?" aria-label="Search" className="w-full bg-transparent text-base text-white outline-none placeholder:text-subdued" />
        </label>
      </form>

      {!res ? (
        <section className="mt-6 md:mt-2">
          <h1 className="font-title text-2xl font-bold">Browse all</h1>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {[...GENRES, PODCAST_HUB].map((g) => (
              <CategoryTile key={g.slug} name={g.name} color={g.color} accent={g.accent} href={`/genre/${g.slug}`} />
            ))}
            <CategoryTile name="Import from YouTube" color="#e13300" accent="#ffffff" href="/import" />
          </div>
        </section>
      ) : (
        <div className="mt-6 md:mt-2">
          {res.tracks.length > 0 && (
            <section>
              <h2 className="font-title text-2xl font-bold">Songs</h2>
              <div className="mt-2">
                <TrackTable tracks={res.tracks.slice(0, 10)} playList={res.tracks} context={{ name: `Search: ${q}`, href: `/search/?q=${encodeURIComponent(q)}` }} header={false} />
              </div>
            </section>
          )}
          {res.artists.length > 0 && <Grid title="Artists">{res.artists.map((a) => <ArtistCard key={a.id} a={a} />)}</Grid>}
          {res.albums.length > 0 && <Grid title="Albums">{res.albums.map((a) => <AlbumCard key={a.id} a={a} />)}</Grid>}
          {res.playlists.length > 0 && <Grid title="Playlists">{res.playlists.map((pl) => <PlaylistCard key={pl.id} pl={pl} />)}</Grid>}
          {!res.tracks.length && !res.artists.length && !res.albums.length && !res.playlists.length && (
            <p className="py-6 text-center text-subdued">
              No results in your library for “{q}”. Try YouTube below.
            </p>
          )}

          <section className="mt-10 rounded-lg bg-elevated p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <MonitorPlay size={28} className="text-[#ff4e45]" />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">Find “{q}” on YouTube</h2>
                <p className="text-sm text-subdued">Paste a link or search by name, then add the results to your library.</p>
              </div>
              <button type="button" onClick={fetchYt} disabled={busy} className="flex h-10 items-center gap-2 rounded-full bg-green px-5 text-sm font-bold text-black hover:scale-105 hover:bg-green-hi disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Fetch &amp; Add to Library
              </button>
            </div>
            {yt && (
              <div className="mt-4">
                {yt.mode === 'fallback' && <p className="mb-3 text-sm text-subdued">YouTube couldn&apos;t be reached right now, so here are close matches from the built-in catalogue.</p>}
                <ul>
                  {yt.tracks.map((t) => {
                    const inLib = added.includes(t.id) || !!lib.trackById(t.id);
                    return (
                      <li key={t.id} className="flex items-center gap-3 rounded px-2 py-2 hover:bg-white/10">
                        <button type="button" aria-label={`Play ${t.title}`} onClick={() => p.playTracks(yt.tracks, yt.tracks.indexOf(t), { name: `YouTube: ${q}`, href: '/import' })}>
                          <Cover cover={t.cover} label={t.title} className="h-12 w-12" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{t.title}</p>
                          <p className="truncate text-sm text-subdued">{t.artistName}</p>
                        </div>
                        <button type="button" disabled={inLib} onClick={() => addAll([t])} className="h-8 shrink-0 rounded-full border border-white/50 px-4 text-sm font-bold hover:border-white disabled:border-green disabled:text-green">
                          {inLib ? 'Added' : 'Add'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {yt.tracks.length > 1 && (
                  <button type="button" onClick={() => addAll(yt.tracks)} className="mt-3 text-sm font-bold text-subdued hover:text-white hover:underline">
                    Add all {yt.tracks.length}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-title text-2xl font-bold">{title}</h2>
      <div className="-mx-3 mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-[60vh]" />}>
      <SearchInner />
    </Suspense>
  );
}
