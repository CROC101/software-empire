'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PlaylistItem, TrackItem } from '@/types/spotify';
import { CUSTOM_SLOTS, PLAYLISTS, TRACKS } from '@/data/seed-spotify';

const KEY = 'sonora-library-v1';

interface Stored {
  liked: { id: string; at: string }[];
  imported: TrackItem[];
  custom: PlaylistItem[];
  order: Record<string, string[]>;
  followed: string[];
  offline: string[];
}

const EMPTY: Stored = {
  liked: [
    { id: 't-snap-back', at: '2026-11-02T10:00:00Z' },
    { id: 't-alien-sunset', at: '2026-11-01T10:00:00Z' },
    { id: 't-closer-to-jazz', at: '2026-10-30T10:00:00Z' },
    { id: 't-river-meditation', at: '2026-10-28T10:00:00Z' },
  ],
  imported: [],
  custom: [],
  order: {},
  followed: ['lofi-dreamers'],
  offline: ['lofi-coding-flow'],
};

interface Library {
  ready: boolean;
  allTracks: TrackItem[];
  imported: TrackItem[];
  trackById: (id: string) => TrackItem | undefined;
  liked: { track: TrackItem; at: string }[];
  isLiked: (id: string) => boolean;
  toggleLike: (track: TrackItem) => void;
  importTracks: (tracks: TrackItem[], playlistId?: string) => void;
  updateImported: (id: string, patch: Partial<TrackItem>) => void;
  removeImported: (id: string) => void;
  playlists: PlaylistItem[];
  playlistById: (id: string) => PlaylistItem | undefined;
  createPlaylist: (name?: string) => string | null;
  renamePlaylist: (id: string, name: string, description?: string) => void;
  setPlaylistTracks: (id: string, trackIds: string[]) => void;
  addToPlaylist: (id: string, trackId: string) => void;
  isFollowing: (artistId: string) => boolean;
  toggleFollow: (artistId: string) => void;
  isOffline: (playlistId: string) => boolean;
  toggleOffline: (playlistId: string) => void;
  offlineCount: number;
}

const Ctx = createContext<Library | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Stored>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...EMPTY, ...(JSON.parse(raw) as Partial<Stored>) });
    } catch {
      /* corrupt storage: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s, ready]);

  const allTracks = useMemo(() => [...TRACKS, ...s.imported], [s.imported]);
  const trackById = useCallback((id: string) => allTracks.find((t) => t.id === id), [allTracks]);

  const playlists = useMemo(
    () => [...PLAYLISTS.map((p) => (s.order[p.id] ? { ...p, trackIds: s.order[p.id] } : p)), ...s.custom],
    [s.order, s.custom],
  );

  const value = useMemo<Library>(() => {
    const set = (fn: (p: Stored) => Stored) => setS(fn);
    const setTracks = (id: string, trackIds: string[]) =>
      set((p) =>
        p.custom.some((c) => c.id === id)
          ? { ...p, custom: p.custom.map((c) => (c.id === id ? { ...c, trackIds } : c)) }
          : { ...p, order: { ...p.order, [id]: trackIds } },
      );
    const playlistById = (id: string) => playlists.find((p) => p.id === id);
    return {
      ready,
      allTracks,
      imported: s.imported,
      trackById,
      liked: s.liked.map((l) => ({ track: trackById(l.id)!, at: l.at })).filter((l) => l.track),
      isLiked: (id) => s.liked.some((l) => l.id === id),
      toggleLike: (track) =>
        set((p) => ({
          ...p,
          liked: p.liked.some((l) => l.id === track.id) ? p.liked.filter((l) => l.id !== track.id) : [{ id: track.id, at: new Date().toISOString() }, ...p.liked],
        })),
      importTracks: (tracks, playlistId) =>
        set((p) => {
          const fresh = tracks.filter((t) => !p.imported.some((i) => i.id === t.id));
          const next = { ...p, imported: [...p.imported, ...fresh] };
          if (!playlistId) return next;
          // p.custom (not the memoised list) so a playlist created in the same tick is found.
          const pl = p.custom.find((x) => x.id === playlistId) ?? playlists.find((x) => x.id === playlistId);
          if (!pl) return next;
          const ids = [...pl.trackIds, ...tracks.map((t) => t.id).filter((id) => !pl.trackIds.includes(id))];
          return p.custom.some((c) => c.id === playlistId)
            ? { ...next, custom: next.custom.map((c) => (c.id === playlistId ? { ...c, trackIds: ids } : c)) }
            : { ...next, order: { ...next.order, [playlistId]: ids } };
        }),
      updateImported: (id, patch) => set((p) => ({ ...p, imported: p.imported.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeImported: (id) => set((p) => ({ ...p, imported: p.imported.filter((t) => t.id !== id) })),
      playlists,
      playlistById,
      createPlaylist: (name) => {
        const id = CUSTOM_SLOTS.find((slot) => !s.custom.some((c) => c.id === slot));
        if (!id) return null;
        const n = s.custom.length + 1;
        set((p) => ({
          ...p,
          custom: [...p.custom, { id, name: name || `My Playlist #${n}`, description: '', owner: 'You', custom: true, trackIds: [], cover: { color: ['#4b2a7b', '#1e5b4f', '#7b3f2a', '#2a4b7b'][n % 4], accent: '#1ed760' } }],
        }));
        return id;
      },
      renamePlaylist: (id, name, description) =>
        set((p) => ({ ...p, custom: p.custom.map((c) => (c.id === id ? { ...c, name, description: description ?? c.description } : c)) })),
      setPlaylistTracks: setTracks,
      addToPlaylist: (id, trackId) => {
        const pl = playlistById(id);
        if (pl && !pl.trackIds.includes(trackId)) setTracks(id, [...pl.trackIds, trackId]);
      },
      isFollowing: (a) => s.followed.includes(a),
      toggleFollow: (a) => set((p) => ({ ...p, followed: p.followed.includes(a) ? p.followed.filter((x) => x !== a) : [...p.followed, a] })),
      isOffline: (id) => s.offline.includes(id),
      toggleOffline: (id) => set((p) => ({ ...p, offline: p.offline.includes(id) ? p.offline.filter((x) => x !== id) : [...p.offline, id] })),
      offlineCount: s.offline.length,
    };
  }, [s, ready, allTracks, trackById, playlists]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLibrary(): Library {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLibrary must be used inside LibraryProvider');
  return v;
}
