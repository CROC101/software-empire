'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { RepeatMode, StreamQuality, TrackItem } from '@/types/spotify';
import { EQ_BANDS, EQ_PRESETS, TRACKS } from '@/data/seed-spotify';
import { hashSeed, renderAmbient } from '@/lib/synth';
import { resolveStream } from '@/lib/youtube';
import { coverDataUrl } from '@/lib/color';
import { useLibrary } from './LibraryContext';

const SETTINGS_KEY = 'sonora-player-v1';

export interface PlayContext {
  name: string;
  href: string;
}

interface Settings {
  volume: number;
  muted: boolean;
  rate: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eq: number[];
  preset: string;
  quality: StreamQuality;
  crossfade: number;
  autoplay: boolean;
  normalize: boolean;
  history: string[];
}

const DEFAULTS: Settings = {
  volume: 0.8,
  muted: false,
  rate: 1,
  shuffle: false,
  repeat: 'off',
  eq: [0, 0, 0, 0, 0],
  preset: 'Flat',
  quality: 'veryhigh',
  crossfade: 0,
  autoplay: true,
  normalize: false,
  history: [],
};

interface Player extends Settings {
  track: TrackItem | null;
  isPlaying: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  /** 'stream' = real audio, 'ambient' = synthesized fallback */
  sourceKind: 'stream' | 'ambient';
  eqActive: boolean;
  context: PlayContext | null;
  upNext: TrackItem[];
  userQueue: TrackItem[];
  playTracks: (tracks: TrackItem[], startIndex?: number, ctx?: PlayContext) => void;
  playTrack: (track: TrackItem, ctx?: PlayContext) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setRate: (r: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (t: TrackItem) => void;
  removeFromQueue: (i: number) => void;
  moveInQueue: (i: number, dir: -1 | 1) => void;
  clearQueue: () => void;
  setEqGain: (band: number, db: number) => void;
  applyPreset: (name: string) => void;
  setQuality: (q: StreamQuality) => void;
  setCrossfade: (s: number) => void;
  setAutoplay: (b: boolean) => void;
  setNormalize: (b: boolean) => void;
  isCurrent: (id: string) => boolean;
}

const Ctx = createContext<Player | null>(null);

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Graph {
  ctx: AudioContext;
  filters: BiquadFilterNode[];
  comp: DynamicsCompressorNode;
}

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  const lib = useLibrary();
  const audioRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [track, setTrack] = useState<TrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sourceKind, setSourceKind] = useState<'stream' | 'ambient'>('stream');
  const [original, setOriginal] = useState<TrackItem[]>([]);
  const [order, setOrder] = useState<TrackItem[]>([]);
  const [pos, setPos] = useState(0);
  const [context, setContext] = useState<PlayContext | null>(null);
  const [userQueue, setUserQueue] = useState<TrackItem[]>([]);
  const fadeRef = useRef(1);

  const s = settings;
  const patch = useCallback((p: Partial<Settings>) => setSettings((o) => ({ ...o, ...p })), []);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, loaded]);

  // Cue a first track (paused) so the player bar is never empty.
  useEffect(() => {
    if (!loaded || track) return;
    const last = settings.history[0] ? lib.trackById(settings.history[0]) : undefined;
    const first = last ?? TRACKS[0];
    setTrack(first);
    setOriginal(TRACKS);
    setOrder(TRACKS);
    setPos(Math.max(0, TRACKS.findIndex((t) => t.id === first.id)));
    setDuration(first.duration);
    setContext({ name: 'Trending songs', href: '/section/0JQ5DB5E8N831KzFzsBBQ2' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // ---- Web Audio graph (built only once the equalizer or normalizer is used, so plain playback stays background-safe on iOS) ----
  const ensureGraph = useCallback((): Graph | null => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (graphRef.current) return graphRef.current;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (audio.crossOrigin !== 'anonymous') {
      // the element was playing a non-CORS stream; reload it CORS-enabled so the graph is not silent
      const t = audio.currentTime;
      const wasPlaying = !audio.paused;
      audio.crossOrigin = 'anonymous';
      audio.load();
      audio.currentTime = t;
      if (wasPlaying) void audio.play().catch(() => undefined);
    }
    const ctx = new AC();
    const src = ctx.createMediaElementSource(audio);
    const filters = EQ_BANDS.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
      b.frequency.value = f;
      b.Q.value = 1;
      return b;
    });
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.ratio.value = 4;
    filters.reduce<AudioNode>((prev, f) => prev.connect(f), src);
    graphRef.current = { ctx, filters, comp };
    return graphRef.current;
  }, []);

  // apply EQ + normalizer to the graph
  useEffect(() => {
    const needs = s.eq.some((g) => g !== 0) || s.normalize;
    const g = graphRef.current ?? (needs && isPlaying ? ensureGraph() : null);
    if (!g) return;
    g.filters.forEach((f, i) => f.gain.setTargetAtTime(s.eq[i] ?? 0, g.ctx.currentTime, 0.05));
    const last = g.filters[g.filters.length - 1];
    last.disconnect();
    g.comp.disconnect();
    if (s.normalize) last.connect(g.comp).connect(g.ctx.destination);
    else last.connect(g.ctx.destination);
  }, [s.eq, s.normalize, isPlaying, ensureGraph]);

  // volume / mute / rate
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = Math.max(0, Math.min(1, s.volume * fadeRef.current));
    a.muted = s.muted;
  }, [s.volume, s.muted, currentTime]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = s.rate;
  }, [s.rate, track]);

  // ---- loading ----
  const loadSeq = useRef(0);
  const load = useCallback(
    async (t: TrackItem, autoplay: boolean) => {
      const a = audioRef.current;
      if (!a) return;
      const seq = ++loadSeq.current;
      setTrack(t);
      setCurrentTime(t.trimStart ?? 0);
      setDuration(t.duration);
      setBuffering(true);
      setSettings((o) => ({ ...o, history: [t.id, ...o.history.filter((h) => h !== t.id)].slice(0, 50) }));
      let src = t.src;
      let kind: 'stream' | 'ambient' = 'stream';
      if (src.startsWith('pending:')) {
        const r = await resolveStream(src.slice(8));
        src = r.src;
        lib.updateImported(t.id, { src });
      }
      if (src.startsWith('synth:')) {
        src = await renderAmbient(Number(src.slice(6)) || hashSeed(t.id));
        kind = 'ambient';
      }
      if (seq !== loadSeq.current) return; // a newer load won
      setSourceKind(kind);
      a.crossOrigin = 'anonymous';
      a.src = src;
      a.dataset.trackId = t.id;
      a.dataset.retried = '';
      if (t.trimStart) a.currentTime = t.trimStart;
      if (autoplay) {
        graphRef.current?.ctx.resume();
        await a.play().catch(() => setIsPlaying(false));
      }
    },
    [lib],
  );

  const onError = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !track || a.dataset.trackId !== track.id) return;
    if (!graphRef.current && a.crossOrigin && !a.dataset.retried) {
      // stream without CORS headers: play it directly (equalizer bypassed)
      a.dataset.retried = '1';
      a.removeAttribute('crossorigin');
      a.load();
      void a.play().catch(() => undefined);
      return;
    }
    // unreachable stream: synthesized ambient fallback keeps playback going
    if (a.src.startsWith('blob:')) return;
    const url = await renderAmbient(hashSeed(track.id));
    a.crossOrigin = 'anonymous';
    a.src = url;
    setSourceKind('ambient');
    void a.play().catch(() => undefined);
  }, [track]);

  // ---- queue navigation ----
  const posRef = useRef(pos);
  posRef.current = pos;

  const playTracks = useCallback(
    (tracks: TrackItem[], startIndex = 0, ctx?: PlayContext) => {
      if (!tracks.length) return;
      const start = tracks[startIndex] ?? tracks[0];
      setOriginal(tracks);
      const ord = s.shuffle ? [start, ...shuffled(tracks.filter((t) => t !== start))] : tracks;
      setOrder(ord);
      setPos(ord.indexOf(start));
      setContext(ctx ?? null);
      void load(start, true);
    },
    [s.shuffle, load],
  );

  const playTrack = useCallback((t: TrackItem, ctx?: PlayContext) => playTracks([t], 0, ctx), [playTracks]);

  const next = useCallback(
    (fromEnded = false) => {
      if (fromEnded && s.repeat === 'one' && track) {
        const a = audioRef.current!;
        a.currentTime = track.trimStart ?? 0;
        void a.play();
        return;
      }
      if (userQueue.length) {
        const [head, ...rest] = userQueue;
        setUserQueue(rest);
        void load(head, true);
        return;
      }
      let p = pos + 1;
      if (p >= order.length) {
        if (s.repeat === 'all' || !fromEnded) p = 0;
        else if (s.autoplay && track) {
          // autoplay: keep going with similar music
          const similar = TRACKS.filter((t) => t.id !== track.id && t.genres.some((g) => track.genres.includes(g)));
          const pick = shuffled(similar.length ? similar : TRACKS).slice(0, 5);
          setOrder((o) => [...o, ...pick]);
          setPos(p);
          void load(pick[0], true);
          return;
        } else {
          setIsPlaying(false);
          return;
        }
      }
      setPos(p);
      if (order[p]) void load(order[p], true);
    },
    [s.repeat, s.autoplay, track, userQueue, pos, order, load],
  );

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = track?.trimStart ?? 0;
      return;
    }
    const p = pos - 1 < 0 ? (s.repeat === 'all' ? order.length - 1 : 0) : pos - 1;
    setPos(p);
    if (order[p]) void load(order[p], true);
  }, [pos, order, s.repeat, load, track]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !track) return;
    if (!a.src) {
      void load(track, true);
      return;
    }
    if (a.paused) {
      graphRef.current?.ctx.resume();
      void a.play().catch(() => undefined);
    } else a.pause();
  }, [track, load]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.src && track) {
      void load(track, true).then(() => {
        a.currentTime = t;
      });
      return;
    }
    a.currentTime = Math.max(0, t);
    setCurrentTime(a.currentTime);
  }, [track, load]);

  // ---- audio element events ----
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setCurrentTime(a.currentTime);
      const end = track?.trimEnd ?? a.duration;
      // crossfade: fade out over the last N seconds, fade in over the first N
      if (s.crossfade > 0 && Number.isFinite(end)) {
        const left = end - a.currentTime;
        const into = a.currentTime - (track?.trimStart ?? 0);
        fadeRef.current = Math.max(0.05, Math.min(1, left / s.crossfade, into / s.crossfade + 0.05));
      } else fadeRef.current = 1;
      if (track?.trimEnd && a.currentTime >= track.trimEnd) next(true);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration)) setDuration(track?.trimEnd ?? a.duration);
      setBuffering(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => next(true);
    const onWait = () => setBuffering(true);
    const onCan = () => setBuffering(false);
    const err = () => void onError();
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('waiting', onWait);
    a.addEventListener('canplay', onCan);
    a.addEventListener('error', err);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('waiting', onWait);
      a.removeEventListener('canplay', onCan);
      a.removeEventListener('error', err);
    };
  }, [track, next, onError, s.crossfade]);

  // resume the audio graph when the page comes back from the background
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void graphRef.current?.ctx.resume();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // ---- Media Session: lock screen + notification controls ----
  const handlers = useRef({ togglePlay, next, prev, seek });
  handlers.current = { togglePlay, next, prev, seek };

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    const art = track.cover.image
      ? [{ src: track.cover.image, sizes: '480x360', type: 'image/jpeg' }]
      : [{ src: coverDataUrl(track.cover, track.title), sizes: '512x512', type: 'image/png' }];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artistName,
      album: track.albumName,
      artwork: [...art, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const a = () => audioRef.current;
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        /* action not supported on this browser */
      }
    };
    set('play', () => {
      void graphRef.current?.ctx.resume();
      void a()?.play();
    });
    set('pause', () => a()?.pause());
    set('previoustrack', () => handlers.current.prev());
    set('nexttrack', () => handlers.current.next());
    set('seekbackward', (d) => handlers.current.seek((a()?.currentTime ?? 0) - (d.seekOffset ?? 10)));
    set('seekforward', (d) => handlers.current.seek((a()?.currentTime ?? 0) + (d.seekOffset ?? 10)));
    set('seekto', (d) => {
      const el = a();
      if (!el || d.seekTime == null) return;
      if (d.fastSeek && 'fastSeek' in el) el.fastSeek(d.seekTime);
      else el.currentTime = d.seekTime;
    });
    set('stop', () => a()?.pause());
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({ duration: a.duration, playbackRate: a.playbackRate || 1, position: Math.min(a.currentTime, a.duration) });
    } catch {
      /* position out of range during a source switch */
    }
  }, [Math.floor(currentTime), duration, s.rate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- public API ----
  const value = useMemo<Player>(
    () => ({
      ...s,
      track,
      isPlaying,
      buffering,
      currentTime,
      duration,
      sourceKind,
      eqActive: !!graphRef.current,
      context,
      upNext: order.slice(pos + 1),
      userQueue,
      playTracks,
      playTrack,
      togglePlay,
      next: () => next(false),
      prev,
      seek,
      setVolume: (v) => patch({ volume: Math.max(0, Math.min(1, v)), muted: false }),
      toggleMute: () => patch({ muted: !s.muted }),
      setRate: (r) => patch({ rate: r }),
      toggleShuffle: () => {
        const on = !s.shuffle;
        patch({ shuffle: on });
        if (!track) return;
        const ord = on ? [track, ...shuffled(original.filter((t) => t.id !== track.id))] : original;
        setOrder(ord);
        setPos(Math.max(0, ord.findIndex((t) => t.id === track.id)));
      },
      cycleRepeat: () => patch({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' }),
      addToQueue: (t) => setUserQueue((q) => [...q, t]),
      removeFromQueue: (i) => setUserQueue((q) => q.filter((_, k) => k !== i)),
      moveInQueue: (i, dir) =>
        setUserQueue((q) => {
          const j = i + dir;
          if (j < 0 || j >= q.length) return q;
          const c = [...q];
          [c[i], c[j]] = [c[j], c[i]];
          return c;
        }),
      clearQueue: () => setUserQueue([]),
      setEqGain: (band, db) => {
        ensureGraph();
        void graphRef.current?.ctx.resume();
        setSettings((o) => ({ ...o, preset: 'Custom', eq: o.eq.map((g, i) => (i === band ? db : g)) }));
      },
      applyPreset: (name) => {
        const p = EQ_PRESETS.find((x) => x.name === name);
        if (!p) return;
        if (name !== 'Flat') ensureGraph();
        void graphRef.current?.ctx.resume();
        patch({ preset: name, eq: [...p.gains] });
      },
      setQuality: (q) => patch({ quality: q }),
      setCrossfade: (c) => patch({ crossfade: c }),
      setAutoplay: (b) => patch({ autoplay: b }),
      setNormalize: (b) => {
        if (b) ensureGraph();
        patch({ normalize: b });
      },
      isCurrent: (id) => track?.id === id,
    }),
    [s, track, isPlaying, buffering, currentTime, duration, sourceKind, context, order, pos, userQueue, original, playTracks, playTrack, togglePlay, next, prev, seek, patch, ensureGraph],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* the one audio element for the whole app; lives in the root layout so it never unmounts */}
      <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" playsInline className="hidden" />
    </Ctx.Provider>
  );
}

export function usePlayer(): Player {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlayer must be used inside SpotifyPlayerProvider');
  return v;
}
