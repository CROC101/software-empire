'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownCircle, CheckCircle2, Pencil, Plus, Search, Shuffle, X } from 'lucide-react';
import type { TrackItem } from '@/types/spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { fmtTotal } from '@/lib/format';
import Cover, { Mosaic } from '@/components/ui/Cover';
import PlayButton from '@/components/ui/PlayButton';
import TrackTable from '@/components/ui/TrackTable';
import { ActionBand, DetailHero, useCoverColor } from '@/components/ui/Hero';

export default function PlaylistView({ id }: { id: string }) {
  const lib = useLibrary();
  const p = usePlayer();
  const pl = lib.playlistById(id);
  const color = useCoverColor(pl?.cover);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const tracks = useMemo(() => (pl ? pl.trackIds.map((t) => lib.trackById(t)).filter((t): t is TrackItem => !!t) : []), [pl, lib]);
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !pl) return [];
    return lib.allTracks.filter((t) => !pl.trackIds.includes(t.id) && `${t.title} ${t.artistName} ${t.albumName}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query, pl, lib.allTracks]);

  if (!lib.ready) return <div className="h-[60vh]" />;
  if (!pl) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-title text-3xl font-bold">This playlist slot is empty</h1>
          <p className="mt-2 text-subdued">Create a playlist from Your Library and it will open here.</p>
          <button
            type="button"
            onClick={() => lib.createPlaylist()}
            className="mt-6 h-12 rounded-full bg-white px-8 font-bold text-black hover:scale-105"
          >
            Create playlist
          </button>
        </div>
      </div>
    );
  }

  const href = `/playlist/${id}`;
  const here = p.context?.href === href;
  const offline = lib.isOffline(id);
  const total = tracks.reduce((s, t) => s + t.duration, 0);
  const art = tracks.length >= 4 && pl.custom ? <Mosaic covers={tracks.slice(0, 4).map((t) => t.cover)} label={pl.name} className="h-full w-full" /> : <Cover cover={pl.cover} label={pl.name} big className="h-full w-full" />;
  const dates = Object.fromEntries(tracks.map((t, i) => [t.id, new Date(Date.parse('2026-10-01') + i * 86400000 * 2).toISOString()]));

  const startEdit = () => {
    setName(pl.name);
    setDesc(pl.description);
    setEditing(true);
  };

  return (
    <div className="pb-10">
      <DetailHero color={color} kind={pl.custom ? 'Playlist' : 'Public Playlist'} title={pl.name} art={art}>
        {pl.description && <p className="w-full pb-1 text-sm text-white/70">{pl.description}</p>}
        <span className="font-bold text-white">{pl.owner}</span>
        <span>
          • {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
          {tracks.length > 0 && `, ${fmtTotal(total)}`}
        </span>
      </DetailHero>

      <ActionBand color={color}>
        <PlayButton playing={here && p.isPlaying} onClick={() => (here ? p.togglePlay() : tracks.length && p.playTracks(tracks, 0, { name: pl.name, href }))} />
        <button
          type="button"
          aria-label="Shuffle"
          onClick={() => {
            if (!p.shuffle) p.toggleShuffle();
            if (tracks.length) p.playTracks(tracks, Math.floor(Math.random() * tracks.length), { name: pl.name, href });
          }}
          className={p.shuffle && here ? 'text-green' : 'text-subdued hover:text-white'}
        >
          <Shuffle size={32} />
        </button>
        <button
          type="button"
          aria-pressed={offline}
          aria-label={offline ? 'Remove download' : 'Download'}
          title={offline ? 'Downloaded — plays offline' : 'Download for offline'}
          onClick={() => lib.toggleOffline(id)}
          className={offline ? 'text-green' : 'text-subdued hover:text-white'}
        >
          {offline ? <CheckCircle2 size={32} /> : <ArrowDownCircle size={32} />}
        </button>
        {pl.custom && (
          <button type="button" aria-label="Edit details" onClick={startEdit} className="text-subdued hover:text-white">
            <Pencil size={26} />
          </button>
        )}
        {offline && <span className="hidden text-sm text-green sm:inline">Downloaded</span>}
      </ActionBand>

      <div className="px-2 md:px-6">
        {tracks.length > 0 ? (
          <TrackTable
            tracks={tracks}
            context={{ name: pl.name, href }}
            showDate
            dates={dates}
            onReorder={(ids) => lib.setPlaylistTracks(id, ids)}
            onRemove={(tid) => lib.setPlaylistTracks(id, pl.trackIds.filter((x) => x !== tid))}
          />
        ) : (
          <p className="px-4 py-6 text-subdued">This playlist is empty. Find something to add below.</p>
        )}

        <section className="mt-8 border-t border-white/10 px-2 pt-6 md:px-4">
          {adding || tracks.length === 0 ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-title text-2xl font-bold">Let&apos;s find something for your playlist</h2>
                  <label className="mt-4 flex h-10 w-full max-w-[364px] items-center gap-2 rounded bg-white/10 px-3 text-subdued focus-within:ring-1 focus-within:ring-white/40">
                    <Search size={16} />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for songs" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-subdued" />
                  </label>
                </div>
                {tracks.length > 0 && (
                  <button type="button" aria-label="Close search" onClick={() => setAdding(false)} className="text-subdued hover:text-white">
                    <X size={24} />
                  </button>
                )}
              </div>
              <ul className="mt-4">
                {found.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded px-2 py-2 hover:bg-white/10">
                    <Cover cover={t.cover} label={t.title} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base">{t.title}</p>
                      <p className="truncate text-sm text-subdued">{t.artistName}</p>
                    </div>
                    <span className="hidden flex-1 truncate text-sm text-subdued md:block">{t.albumName}</span>
                    <button type="button" onClick={() => lib.addToPlaylist(id, t.id)} className="h-8 rounded-full border border-white/50 px-4 text-sm font-bold hover:scale-105 hover:border-white">
                      Add
                    </button>
                  </li>
                ))}
                {query && !found.length && (
                  <li className="px-2 py-4 text-sm text-subdued">
                    No matches. Try <Link href={`/search/?q=${encodeURIComponent(query)}`} className="text-white underline">full search</Link> or{' '}
                    <Link href="/import" className="text-white underline">import from YouTube</Link>.
                  </li>
                )}
              </ul>
            </>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-2 text-sm font-bold text-subdued hover:text-white">
              <Plus size={18} /> Add songs
            </button>
          )}
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setEditing(false)}>
          <form
            role="dialog"
            aria-label="Edit details"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              lib.renamePlaylist(id, name.trim() || pl.name, desc);
              setEditing(false);
            }}
            className="w-full max-w-[524px] rounded-lg bg-elevated p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit details</h2>
              <button type="button" aria-label="Close" onClick={() => setEditing(false)} className="text-subdued hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" maxLength={100} className="mt-4 h-10 w-full rounded bg-white/10 px-3 text-sm outline-none focus:ring-1 focus:ring-white/40" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Description" placeholder="Add an optional description" maxLength={300} className="mt-3 h-28 w-full resize-none rounded bg-white/10 p-3 text-sm outline-none focus:ring-1 focus:ring-white/40" />
            <div className="mt-4 flex justify-end">
              <button type="submit" className="h-12 rounded-full bg-white px-8 font-bold text-black hover:scale-105">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
