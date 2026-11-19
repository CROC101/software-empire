'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Channel, Comment, HistoryEntry, Playlist, Poll, Video } from '@/types/youtube';
import {
  CHANNELS,
  CUSTOM_PLAYLIST_SLOTS,
  SEED_PLAYLISTS,
  SEED_POLLS,
  SEED_VIDEOS,
  seedComments,
} from '@/data/seed-youtube';

const KEY = 'viewtube:v1';
export const MY_CHANNEL_ID = 'CrocByteDev';

interface Persisted {
  uploads: Video[];
  liked: string[];
  disliked: string[];
  watchLater: string[];
  subscribed: string[];
  history: HistoryEntry[];
  historyPaused: boolean;
  searchHistory: string[];
  searchPaused: boolean;
  playlists: Playlist[];
  comments: Record<string, Comment[]>;
  pollVotes: Record<string, number>;
  queue: string[];
}

const initial: Persisted = {
  uploads: [],
  liked: ['agentloop', 'neondrive'],
  disliked: [],
  watchLater: ['urlshort', 'gpu2026', 'rust100s'],
  subscribed: ['CrocByteDev', 'SynthWaveRadio', 'DesignSystemsLab'],
  history: [],
  historyPaused: false,
  searchHistory: [],
  searchPaused: false,
  playlists: [
    { id: 'PL1', title: 'Weekend Deep Dives', videoIds: ['nxt15course', 'eventdriven', 'gamejam48'], createdAt: '2026-11-01T12:00:00.000Z' },
  ],
  comments: {},
  pollVotes: {},
  queue: [],
};

export interface MiniState {
  videoId: string;
  time: number;
  list?: string;
}

export interface ListView {
  id: string;
  title: string;
  videoIds: string[];
  builtIn: boolean;
  editable: boolean;
  ownerId?: string;
  description?: string;
}

const mapComments = (list: Comment[], id: string, fn: (c: Comment) => Comment): Comment[] =>
  list.map((c) => (c.id === id ? fn(c) : { ...c, replies: mapComments(c.replies, id, fn) }));

const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [id, ...arr]);

function useYouTubeState() {
  const [s, setS] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarFull, setSidebarFull] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mini, setMini] = useState<MiniState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...initial, ...(JSON.parse(raw) as Partial<Persisted>) });
    } catch {
      /* corrupt storage: keep defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* quota full: state still works in memory */
    }
  }, [s, hydrated]);

  const videos = useMemo(() => [...s.uploads, ...SEED_VIDEOS], [s.uploads]);
  const channels: Channel[] = CHANNELS;

  const getVideo = useCallback((id: string | null | undefined) => videos.find((x) => x.id === id), [videos]);
  const getChannel = useCallback((id: string | null | undefined) => CHANNELS.find((c) => c.id === id), []);

  const getList = useCallback(
    (id: string): ListView | undefined => {
      if (id === 'WL') return { id, title: 'Watch later', videoIds: s.watchLater, builtIn: true, editable: true };
      if (id === 'LL') return { id, title: 'Liked videos', videoIds: s.liked, builtIn: true, editable: true };
      const mine = s.playlists.find((p) => p.id === id);
      if (mine) return { ...mine, builtIn: false, editable: true };
      const seeded = SEED_PLAYLISTS.find((p) => p.id === id);
      if (seeded) return { ...seeded, builtIn: false, editable: false };
      return undefined;
    },
    [s.watchLater, s.liked, s.playlists],
  );

  const getComments = useCallback((videoId: string) => s.comments[videoId] ?? seedComments(videoId), [s.comments]);

  const update = (fn: (p: Persisted) => Partial<Persisted>) => setS((p) => ({ ...p, ...fn(p) }));

  const actions = {
    toggleLike: (id: string) => update((p) => ({ liked: toggle(p.liked, id), disliked: p.disliked.filter((x) => x !== id) })),
    toggleDislike: (id: string) => update((p) => ({ disliked: toggle(p.disliked, id), liked: p.liked.filter((x) => x !== id) })),
    toggleWatchLater: (id: string) => update((p) => ({ watchLater: toggle(p.watchLater, id) })),
    toggleSubscribe: (channelId: string) => update((p) => ({ subscribed: toggle(p.subscribed, channelId) })),
    recordHistory: (videoId: string) =>
      update((p) =>
        p.historyPaused
          ? {}
          : { history: [{ videoId, watchedAt: new Date().toISOString() }, ...p.history.filter((h) => h.videoId !== videoId)].slice(0, 200) },
      ),
    removeHistory: (videoId: string) => update((p) => ({ history: p.history.filter((h) => h.videoId !== videoId) })),
    clearHistory: () => update(() => ({ history: [] })),
    setHistoryPaused: (b: boolean) => update(() => ({ historyPaused: b })),
    addSearch: (q: string) =>
      update((p) => (p.searchPaused || !q.trim() ? {} : { searchHistory: [q.trim(), ...p.searchHistory.filter((x) => x !== q.trim())].slice(0, 20) })),
    removeSearch: (q: string) => update((p) => ({ searchHistory: p.searchHistory.filter((x) => x !== q) })),
    clearSearchHistory: () => update(() => ({ searchHistory: [] })),
    setSearchPaused: (b: boolean) => update(() => ({ searchPaused: b })),
    /** Returns the new playlist id, or null when every slot is used. */
    createPlaylist: (title: string, videoIds: string[] = []): string | null => {
      const id = CUSTOM_PLAYLIST_SLOTS.find((slot) => !s.playlists.some((p) => p.id === slot));
      if (!id) return null;
      update((p) => ({ playlists: [...p.playlists, { id, title: title.trim() || 'Untitled list', videoIds, createdAt: new Date().toISOString() }] }));
      return id;
    },
    deletePlaylist: (id: string) => update((p) => ({ playlists: p.playlists.filter((x) => x.id !== id) })),
    togglePlaylistVideo: (listId: string, videoId: string) => {
      if (listId === 'WL') return update((p) => ({ watchLater: toggle(p.watchLater, videoId) }));
      if (listId === 'LL') return update((p) => ({ liked: toggle(p.liked, videoId) }));
      update((p) => ({
        playlists: p.playlists.map((pl) =>
          pl.id === listId
            ? { ...pl, videoIds: pl.videoIds.includes(videoId) ? pl.videoIds.filter((x) => x !== videoId) : [...pl.videoIds, videoId] }
            : pl,
        ),
      }));
    },
    /** Replace a list's order (used by drag-to-reorder). */
    reorderList: (listId: string, videoIds: string[]) => {
      if (listId === 'WL') return update(() => ({ watchLater: videoIds }));
      if (listId === 'LL') return update(() => ({ liked: videoIds }));
      update((p) => ({ playlists: p.playlists.map((pl) => (pl.id === listId ? { ...pl, videoIds } : pl)) }));
    },
    addComment: (videoId: string, text: string, parentId?: string) => {
      const c: Comment = {
        id: `${videoId}-u${Date.now().toString(36)}`,
        author: '@you',
        avatar: ['#3ea6ff', '#0b2d5c'],
        text: text.trim(),
        likes: 0,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      update((p) => {
        const list = p.comments[videoId] ?? seedComments(videoId);
        const next = parentId ? mapComments(list, parentId, (x) => ({ ...x, replies: [...x.replies, c] })) : [c, ...list];
        return { comments: { ...p.comments, [videoId]: next } };
      });
    },
    toggleCommentLike: (videoId: string, commentId: string) =>
      update((p) => ({
        comments: {
          ...p.comments,
          [videoId]: mapComments(p.comments[videoId] ?? seedComments(videoId), commentId, (x) => ({
            ...x,
            liked: !x.liked,
            likes: x.likes + (x.liked ? -1 : 1),
          })),
        },
      })),
    toggleHeart: (videoId: string, commentId: string) =>
      update((p) => ({
        comments: {
          ...p.comments,
          [videoId]: mapComments(p.comments[videoId] ?? seedComments(videoId), commentId, (x) => ({ ...x, hearted: !x.hearted })),
        },
      })),
    vote: (pollId: string, option: number) => update((p) => ({ pollVotes: { ...p.pollVotes, [pollId]: option } })),
    addToQueue: (id: string) => update((p) => ({ queue: p.queue.includes(id) ? p.queue : [...p.queue, id] })),
    clearQueue: () => update(() => ({ queue: [] })),
    uploadVideo: (video: Omit<Video, 'id' | 'views' | 'likes' | 'publishedAt'>): string => {
      const id = `up${Date.now().toString(36)}`;
      update((p) => ({ uploads: [{ ...video, id, views: 0, likes: 0, publishedAt: new Date().toISOString() }, ...p.uploads] }));
      return id;
    },
    deleteUpload: (id: string) => update((p) => ({ uploads: p.uploads.filter((x) => x.id !== id) })),
  };

  const polls: Poll[] = SEED_POLLS;

  return {
    ...s,
    ...actions,
    hydrated,
    videos,
    channels,
    polls,
    getVideo,
    getChannel,
    getList,
    getComments,
    sidebarFull,
    setSidebarFull,
    drawerOpen,
    setDrawerOpen,
    mini,
    setMini,
  };
}

type Ctx = ReturnType<typeof useYouTubeState>;
const YouTubeCtx = createContext<Ctx | null>(null);

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const value = useYouTubeState();
  return <YouTubeCtx.Provider value={value}>{children}</YouTubeCtx.Provider>;
}

export function useYouTube(): Ctx {
  const ctx = useContext(YouTubeCtx);
  if (!ctx) throw new Error('useYouTube must be used inside <YouTubeProvider>');
  return ctx;
}
