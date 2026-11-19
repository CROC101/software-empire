'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RectangleHorizontal,
  Settings,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Video } from '@/types/youtube';
import { clock, cx } from '@/lib/format';

export interface PlayerHandle {
  seekTo: (t: number) => void;
  getTime: () => number;
  isPlaying: () => boolean;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];
// shortcut: the sample streams have one rendition, so quality only changes the label; wire real sources per quality when available.
const QUALITIES = ['1080p60', '720p', '480p', 'Auto'];

export default function CustomVideoPlayer({
  video,
  playerRef,
  startAt = 0,
  theater,
  onTheater,
  onMini,
  onNext,
  onEnded,
  onTime,
}: {
  video: Video;
  playerRef?: Ref<PlayerHandle>;
  startAt?: number;
  theater: boolean;
  onTheater: () => void;
  onMini: (time: number) => void;
  onNext?: () => void;
  onEnded?: () => void;
  onTime?: (t: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(video.duration);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState('1080p60');
  const [menu, setMenu] = useState<null | 'root' | 'speed' | 'quality'>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [idle, setIdle] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [fs, setFs] = useState(false);
  const [flash, setFlash] = useState<{ key: number; icon: 'play' | 'pause' | 'text'; text?: string } | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(
    playerRef,
    () => ({
      seekTo: (t: number) => {
        const el = vid.current;
        if (!el) return;
        el.currentTime = t;
        el.play().catch(() => undefined);
      },
      getTime: () => vid.current?.currentTime ?? 0,
      isPlaying: () => !!vid.current && !vid.current.paused,
    }),
    [],
  );

  const show = (icon: 'play' | 'pause' | 'text', text?: string) => setFlash({ key: Date.now(), icon, text });

  const toggle = useCallback(() => {
    const el = vid.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
      show('play');
    } else {
      el.pause();
      show('pause');
    }
  }, []);

  const seekBy = useCallback((d: number) => {
    const el = vid.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + d), el.duration || Infinity);
    show('text', `${d > 0 ? '+' : ''}${d}s`);
  }, []);

  const setVol = useCallback((v: number) => {
    const el = vid.current;
    if (!el) return;
    el.volume = Math.min(1, Math.max(0, v));
    el.muted = el.volume === 0;
  }, []);

  const toggleMute = useCallback(() => {
    const el = vid.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.volume === 0) el.volume = 0.5;
  }, []);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else box.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const mini = useCallback(() => onMini(vid.current?.currentTime ?? 0), [onMini]);

  // Autoplay with sound when allowed, otherwise muted.
  useEffect(() => {
    const el = vid.current;
    if (!el) return;
    el.currentTime = startAt;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  useEffect(() => {
    const fn = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = vid.current;
      if (!el) return;
      const k = e.key.toLowerCase();
      const map: Record<string, () => void> = {
        ' ': toggle,
        k: toggle,
        m: toggleMute,
        t: onTheater,
        i: mini,
        f: toggleFs,
        arrowleft: () => seekBy(-5),
        arrowright: () => seekBy(5),
        j: () => seekBy(-10),
        l: () => seekBy(10),
        arrowup: () => (setVol(el.volume + 0.05), show('text', `${Math.round(Math.min(1, el.volume) * 100)}%`)),
        arrowdown: () => (setVol(el.volume - 0.05), show('text', `${Math.round(Math.max(0, el.volume) * 100)}%`)),
      };
      if (map[k]) {
        if (k === ' ' && t.closest('button')) return;
        e.preventDefault();
        map[k]();
        poke();
      } else if (/^[0-9]$/.test(k) && Number.isFinite(el.duration)) {
        el.currentTime = (Number(k) / 10) * el.duration;
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggle, toggleMute, onTheater, mini, toggleFs, seekBy, setVol]);

  const poke = () => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2600);
  };

  const fracAt = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const onScrub = (clientX: number) => {
    const el = vid.current;
    if (!el) return;
    const f = fracAt(clientX);
    el.currentTime = f * (el.duration || duration);
    setTime(el.currentTime);
  };

  useEffect(() => {
    if (!scrubbing) return;
    const move = (e: PointerEvent) => onScrub(e.clientX);
    const up = () => setScrubbing(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing]);

  const dur = duration || video.duration || 1;
  const progress = Math.min(1, time / dur);
  const chapters = video.chapters.filter((c) => c.time < dur);
  const chapterAt = (t: number) => [...chapters].reverse().find((c) => c.time <= t);
  const current = chapterAt(time);
  const hoverTime = hoverX !== null ? hoverX * dur : 0;
  const controlsVisible = !playing || !idle || menu !== null || scrubbing;
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={box}
      className={cx('group/player relative w-full overflow-hidden bg-black select-none', fs ? 'h-full' : theater ? 'h-[min(calc(100vh-169px),56.25vw)] max-h-[calc(100vh-56px)]' : 'aspect-video rounded-card', !controlsVisible && 'cursor-none')}
      onMouseMove={poke}
      onMouseLeave={() => playing && setIdle(true)}
    >
      <video
        ref={vid}
        src={video.src}
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full"
        onClick={() => {
          if (menu) setMenu(null);
          else toggle();
        }}
        onDoubleClick={toggleFs}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)}
        onPlaying={() => setWaiting(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setTime(el.currentTime);
          onTime?.(el.currentTime);
          if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onRateChange={(e) => setSpeed(e.currentTarget.playbackRate)}
        onEnded={onEnded}
      />

      {waiting && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 size={56} className="animate-spin text-white/80" />
        </div>
      )}

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.key}
            initial={{ opacity: 0.9, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute top-1/2 left-1/2 grid h-[52px] min-w-[52px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 px-3 text-white"
          >
            {flash.icon === 'play' ? <Play size={26} fill="currentColor" /> : flash.icon === 'pause' ? <Pause size={26} fill="currentColor" /> : <span className="text-sm font-medium">{flash.text}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {video.isLive && <span className="absolute top-3 left-3 rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-white">LIVE</span>}

      {/* Controls */}
      <div className={cx('absolute inset-x-0 bottom-0 px-3 pt-16 transition-opacity duration-200', controlsVisible ? 'opacity-100' : 'opacity-0')} style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.75))' }}>
        {/* Seek bar */}
        <div
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label="Seek slider"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${clock(time)} of ${clock(dur)}`}
          className="group/bar relative flex h-4 cursor-pointer items-center"
          onPointerDown={(e) => {
            setScrubbing(true);
            onScrub(e.clientX);
          }}
          onMouseMove={(e) => setHoverX(fracAt(e.clientX))}
          onMouseLeave={() => setHoverX(null)}
        >
          <div className="relative flex h-[3px] w-full gap-[2px] transition-[height] group-hover/bar:h-[5px]">
            {(chapters.length > 1 ? chapters : [{ time: 0, title: '' }]).map((c, i, arr) => {
              const start = c.time / dur;
              const end = (arr[i + 1]?.time ?? dur) / dur;
              const fill = (x: number) => `${Math.min(100, Math.max(0, ((x - start) / (end - start)) * 100))}%`;
              return (
                <div key={c.time} className="relative h-full overflow-hidden bg-white/20" style={{ width: `${(end - start) * 100}%` }}>
                  <div className="absolute inset-y-0 left-0 bg-white/40" style={{ width: fill(buffered / dur) }} />
                  {hoverX !== null && <div className="absolute inset-y-0 left-0 bg-white/50" style={{ width: fill(hoverX) }} />}
                  <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: fill(progress) }} />
                </div>
              );
            })}
          </div>
          <div
            className={cx('absolute h-[13px] w-[13px] -translate-x-1/2 rounded-full bg-brand transition-transform', scrubbing ? 'scale-100' : 'scale-0 group-hover/bar:scale-100')}
            style={{ left: `${progress * 100}%` }}
          />
          {hoverX !== null && (
            <div className="pointer-events-none absolute bottom-6 flex -translate-x-1/2 flex-col items-center" style={{ left: `clamp(60px, ${hoverX * 100}%, calc(100% - 60px))` }}>
              <div className="mb-1 aspect-video w-[120px] overflow-hidden rounded-chip border-2 border-white" style={{ background: `linear-gradient(135deg, ${video.thumb.from}, ${video.thumb.to})` }} />
              {chapterAt(hoverTime)?.title && <span className="max-w-[160px] truncate text-xs font-medium text-white drop-shadow">{chapterAt(hoverTime)?.title}</span>}
              <span className="tabular text-sm font-medium text-white drop-shadow">{clock(hoverTime)}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex h-12 items-center gap-1 text-white">
          <button type="button" aria-label={playing ? 'Pause (k)' : 'Play (k)'} title={playing ? 'Pause (k)' : 'Play (k)'} onClick={toggle} className="grid h-12 w-12 place-items-center">
            {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
          </button>
          {onNext && (
            <button type="button" aria-label="Next" title="Next" onClick={onNext} className="hidden h-12 w-10 place-items-center sm:grid">
              <SkipForward size={24} fill="currentColor" />
            </button>
          )}
          <div className="group/vol flex items-center">
            <button type="button" aria-label={muted ? 'Unmute (m)' : 'Mute (m)'} title={muted ? 'Unmute (m)' : 'Mute (m)'} onClick={toggleMute} className="grid h-12 w-10 place-items-center">
              <VolIcon size={24} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => setVol(Number(e.target.value))}
              className="yt-range w-0 cursor-pointer opacity-0 transition-all duration-200 group-hover/vol:mr-2 group-hover/vol:w-16 group-hover/vol:opacity-100 focus:mr-2 focus:w-16 focus:opacity-100"
              style={{ ['--val' as string]: `${(muted ? 0 : volume) * 100}%` }}
            />
          </div>
          <span className="tabular px-1 text-[13px] whitespace-nowrap">
            {video.isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> LIVE
              </span>
            ) : (
              `${clock(time)} / ${clock(dur)}`
            )}
          </span>
          {current && chapters.length > 1 && (
            <span className="hidden min-w-0 items-center truncate text-[13px] md:flex">
              <span className="mx-1">•</span>
              <span className="truncate">{current.title}</span>
              <ChevronRight size={16} />
            </span>
          )}
          <div className="flex-1" />

          <div className="relative">
            <button type="button" aria-label="Settings" title="Settings" aria-expanded={menu !== null} onClick={() => setMenu((m) => (m ? null : 'root'))} className="relative grid h-12 w-12 place-items-center">
              <Settings size={24} className={cx('transition-transform', menu && 'rotate-45')} />
              <span className="absolute top-2.5 right-1.5 rounded-sm bg-brand px-0.5 text-[8px] leading-[10px] font-bold">HD</span>
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 bottom-14 z-20 w-[250px] rounded-card bg-[rgba(28,28,28,.92)] py-2 text-sm backdrop-blur"
                >
                  {menu === 'root' && (
                    <>
                      <button type="button" onClick={() => setMenu('speed')} className="flex h-10 w-full items-center gap-4 px-4 hover:bg-soft">
                        <Gauge size={22} /> <span className="flex-1 text-left">Playback speed</span>
                        <span className="text-white/80">{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        <ChevronRight size={18} />
                      </button>
                      <button type="button" onClick={() => setMenu('quality')} className="flex h-10 w-full items-center gap-4 px-4 hover:bg-soft">
                        <SlidersHorizontal size={22} /> <span className="flex-1 text-left">Quality</span>
                        <span className="text-white/80">{quality}</span>
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  {menu !== 'root' && (
                    <>
                      <button type="button" onClick={() => setMenu('root')} className="mb-1 flex h-10 w-full items-center gap-2 border-b border-white/20 px-3 hover:bg-soft">
                        <ChevronLeft size={20} /> {menu === 'speed' ? 'Playback speed' : 'Quality'}
                      </button>
                      {(menu === 'speed' ? SPEEDS.map(String) : QUALITIES).map((opt) => {
                        const active = menu === 'speed' ? Number(opt) === speed : opt === quality;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (menu === 'speed') {
                                if (vid.current) vid.current.playbackRate = Number(opt);
                              } else {
                                setQuality(opt);
                                show('text', opt);
                              }
                              setMenu(null);
                            }}
                            className="flex h-9 w-full items-center gap-3 px-4 text-left hover:bg-soft"
                          >
                            <span className="w-5">{active && <Check size={18} />}</span>
                            {menu === 'speed' ? (opt === '1' ? 'Normal' : `${opt}x`) : opt}
                          </button>
                        );
                      })}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button type="button" aria-label="Miniplayer (i)" title="Miniplayer (i)" onClick={mini} className="hidden h-12 w-12 place-items-center sm:grid">
            <PictureInPicture2 size={22} />
          </button>
          <button type="button" aria-label={theater ? 'Default view (t)' : 'Theater mode (t)'} title={theater ? 'Default view (t)' : 'Theater mode (t)'} onClick={onTheater} className="hidden h-12 w-12 place-items-center md:grid">
            <RectangleHorizontal size={theater ? 20 : 24} />
          </button>
          <button type="button" aria-label={fs ? 'Exit full screen (f)' : 'Full screen (f)'} title={fs ? 'Exit full screen (f)' : 'Full screen (f)'} onClick={toggleFs} className="grid h-12 w-12 place-items-center">
            {fs ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
