"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { seedComments, seedVideos, UPLOAD_SLOTS, PLAYLIST_SLOTS } from "@/data/seed-media";
import type { CommentItem, PlaylistItem, VideoItem } from "@/types/media";

interface HubState {
  subscriptions: string[];
  history: string[];
  watchLater: string[];
  favorites: string[];
  playlists: PlaylistItem[]; // custom playlists only
  ratings: Record<string, "up" | "down">;
  comments: Record<string, CommentItem[]>; // user-written comments per video
  uploads: VideoItem[];
  dismissed: string[];
}

const EMPTY: HubState = {
  subscriptions: [],
  history: [],
  watchLater: [],
  favorites: [],
  playlists: [],
  ratings: {},
  comments: {},
  uploads: [],
  dismissed: [],
};

const KEY = "streamhub-state-v1";

interface Toast {
  id: number;
  text: string;
}

interface HubApi extends HubState {
  hydrated: boolean;
  videos: VideoItem[];
  getVideo: (id: string) => VideoItem | undefined;
  getPlaylist: (slug: string) => PlaylistItem | undefined;
  allPlaylists: PlaylistItem[];
  toggleSubscribe: (handle: string) => void;
  toggleWatchLater: (id: string) => void;
  toggleFavorite: (id: string) => void;
  rate: (id: string, value: "up" | "down") => void;
  addHistory: (id: string) => void;
  addComment: (videoId: string, text: string) => void;
  commentsFor: (videoId: string) => CommentItem[];
  createPlaylist: (name: string, firstVideo?: string) => string | null;
  togglePlaylistVideo: (playlistId: string, videoId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  publishVideo: (v: Omit<VideoItem, "id">) => string | null;
  dismiss: (id: string) => void;
  toast: (text: string) => void;
}

const Ctx = createContext<HubApi | null>(null);

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);

export function MediaHubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HubState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // SSR-safe: read storage only after mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<HubState>) });
    } catch {
      /* corrupt storage: start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep in memory */
    }
  }, [state, hydrated]);

  const toast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const videos = useMemo(() => [...state.uploads, ...seedVideos], [state.uploads]);

  const api = useMemo<HubApi>(() => {
    const systemPlaylists: PlaylistItem[] = [
      { id: "watch-later", name: "Watch Later", videoIds: state.watchLater, system: true },
      { id: "favorites", name: "Favorites", videoIds: state.favorites, system: true },
      { id: "history", name: "Watch History", videoIds: state.history, system: true },
    ];
    const allPlaylists = [...systemPlaylists, ...state.playlists];
    return {
      ...state,
      hydrated,
      videos,
      allPlaylists,
      getVideo: (id) => videos.find((v) => v.id === id),
      getPlaylist: (slug) => allPlaylists.find((p) => p.id === slug),
      toggleSubscribe: (handle) => setState((s) => ({ ...s, subscriptions: toggle(s.subscriptions, handle) })),
      toggleWatchLater: (id) => setState((s) => ({ ...s, watchLater: toggle(s.watchLater, id) })),
      toggleFavorite: (id) => setState((s) => ({ ...s, favorites: toggle(s.favorites, id) })),
      rate: (id, value) =>
        setState((s) => {
          const ratings = { ...s.ratings };
          if (ratings[id] === value) delete ratings[id];
          else ratings[id] = value;
          return { ...s, ratings };
        }),
      addHistory: (id) => setState((s) => ({ ...s, history: [id, ...s.history.filter((x) => x !== id)].slice(0, 50) })),
      addComment: (videoId, text) =>
        setState((s) => ({
          ...s,
          comments: {
            ...s.comments,
            [videoId]: [
              { id: `${videoId}-u${Date.now()}`, videoId, author: "you", text, postedAt: new Date().toISOString(), likes: 0 },
              ...(s.comments[videoId] ?? []),
            ],
          },
        })),
      commentsFor: (videoId) => [...(state.comments[videoId] ?? []), ...seedComments(videoId)],
      createPlaylist: (name, firstVideo) => {
        const slot = PLAYLIST_SLOTS.find((p) => !state.playlists.some((x) => x.id === p));
        if (!slot) return null;
        setState((s) => ({ ...s, playlists: [...s.playlists, { id: slot, name, videoIds: firstVideo ? [firstVideo] : [] }] }));
        return slot;
      },
      togglePlaylistVideo: (playlistId, videoId) =>
        setState((s) => {
          if (playlistId === "watch-later") return { ...s, watchLater: toggle(s.watchLater, videoId) };
          if (playlistId === "favorites") return { ...s, favorites: toggle(s.favorites, videoId) };
          return {
            ...s,
            playlists: s.playlists.map((p) => (p.id === playlistId ? { ...p, videoIds: toggle(p.videoIds, videoId) } : p)),
          };
        }),
      deletePlaylist: (playlistId) => setState((s) => ({ ...s, playlists: s.playlists.filter((p) => p.id !== playlistId) })),
      publishVideo: (v) => {
        const slot = UPLOAD_SLOTS.find((id) => !state.uploads.some((u) => u.id === id));
        if (!slot) return null;
        setState((s) => ({ ...s, uploads: [{ ...v, id: slot }, ...s.uploads] }));
        return slot;
      },
      dismiss: (id) => setState((s) => ({ ...s, dismissed: [...s.dismissed, id] })),
      toast,
    };
  }, [state, hydrated, videos, toast]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="rounded-[3px] border border-brand/60 bg-surface-2 px-4 py-2.5 text-md font-bold text-white shadow-lg"
              role="status"
            >
              <span className="mr-2 rounded-[2px] bg-brand px-1.5 py-0.5 text-2xs text-black">PREMIUM</span>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useHub() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHub must be used inside MediaHubProvider");
  return v;
}
