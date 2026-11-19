"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Maximize, Minimize, Pause, Play, Repeat, RectangleHorizontal, RotateCcw, RotateCw, Volume2, VolumeX, Settings,
} from "lucide-react";
import { CoverArt } from "./CoverArt";
import { formatDuration } from "@/lib/format";
import type { ChapterMarker } from "@/types/media";

const QUALITIES = ["4K 2160p", "1080p60", "720p"] as const;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function TheaterPlayer({
  src,
  seed,
  palette,
  chapters,
  videoRef,
  theater,
  onTheater,
  onEnded,
  autoPlay = false,
}: {
  src: string;
  seed: string;
  palette: [string, string, string];
  chapters: ChapterMarker[];
  videoRef: RefObject<HTMLVideoElement | null>;
  theater: boolean;
  onTheater: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>("4K 2160p");
  const [loop, setLoop] = useState(false);
  const [full, setFull] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const v = () => videoRef.current;
  const toggle = () => {
    const el = v();
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };
  const skip = (d: number) => {
    const el = v();
    if (el) el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + d));
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrap.current?.requestFullscreen?.();
  };
  const show = (t: string) => {
    setFlash(t);
    setTimeout(() => setFlash(null), 900);
  };

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Keyboard shortcuts: Space, F, arrows, T (ignored while typing).
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "f" || e.key === "F") fullscreen();
      else if (e.key === "ArrowRight") skip(10);
      else if (e.key === "ArrowLeft") skip(-10);
      else if (e.key === "t" || e.key === "T") onTheater();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  useEffect(() => {
    const el = v();
    if (el) {
      el.volume = volume;
      el.muted = muted;
      el.playbackRate = speed;
      el.loop = loop;
    }
  });

  const pct = duration ? (time / duration) * 100 : 0;
  const hoverChapter = hover === null ? null : [...chapters].reverse().find((c) => c.time <= hover) ?? chapters[0];

  return (
    <div
      ref={wrap}
      className={`group/player relative w-full overflow-hidden bg-black ${full ? "h-full" : "aspect-video"} ${theater ? "max-h-[78vh]" : ""}`}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full bg-black object-contain"
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />
      {!playing && time === 0 && (
        <button onClick={toggle} className="absolute inset-0 flex items-center justify-center" aria-label="Play video">
          <span className="absolute inset-0 opacity-60">
            <CoverArt seed={seed} palette={palette} />
          </span>
          <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand text-black shadow-[0_0_30px_rgba(255,144,0,0.5)]">
            <Play className="ml-1 h-9 w-9" fill="currentColor" />
          </span>
        </button>
      )}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-black/70 px-4 py-2 text-xl font-bold text-white"
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-10 opacity-100 transition-opacity group-hover/player:opacity-100 md:opacity-0 [&:focus-within]:opacity-100">
        <div
          className="relative h-[14px] cursor-pointer"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(((e.clientX - r.left) / r.width) * (duration || 0));
          }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const el = v();
            if (el && duration) el.currentTime = ((e.clientX - r.left) / r.width) * duration;
          }}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
        >
          <div className="absolute inset-x-0 top-[5px] h-[4px] rounded-full bg-white/25" />
          <div className="absolute left-0 top-[5px] h-[4px] rounded-full bg-brand" style={{ width: `${pct}%` }} />
          {duration > 0 &&
            chapters.map((c) => (
              <span key={c.time} className="absolute top-[5px] h-[4px] w-[2px] bg-black" style={{ left: `${(c.time / duration) * 100}%` }} />
            ))}
          <span className="absolute top-[1px] h-[12px] w-[12px] -translate-x-1/2 rounded-full bg-brand" style={{ left: `${pct}%` }} />
          {hover !== null && duration > 0 && (
            <div
              className="pointer-events-none absolute bottom-[20px] w-[160px] -translate-x-1/2 overflow-hidden rounded-[3px] border border-hairline bg-black"
              style={{ left: `clamp(80px, ${(hover / duration) * 100}%, calc(100% - 80px))` }}
            >
              <div className="aspect-video">
                <CoverArt seed={seed} palette={palette} frame={Math.floor((hover / duration) * 6)} />
              </div>
              <p className="truncate px-2 py-1 text-xs text-white">
                <span className="text-brand">{formatDuration(hover)}</span> · {hoverChapter?.title}
              </p>
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-white">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="hover:text-brand">
            {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
          </button>
          <button onClick={() => { skip(-10); show("-10s"); }} aria-label="Back 10 seconds" className="hover:text-brand">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={() => { skip(10); show("+10s"); }} aria-label="Forward 10 seconds" className="hover:text-brand">
            <RotateCw className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className="hover:text-brand">
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              aria-label="Volume"
              className="w-[70px]"
            />
          </div>
          <span className="text-xs tabular-nums">
            {formatDuration(time)} / {formatDuration(duration)}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setLoop((l) => !l)} aria-label="Loop" aria-pressed={loop} className={loop ? "text-brand" : "hover:text-brand"}>
              <Repeat className="h-5 w-5" />
            </button>
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} aria-label="Settings" aria-expanded={menu} className="flex items-center gap-1 hover:text-brand">
                <Settings className="h-5 w-5" />
                <span className="rounded-[2px] bg-brand px-1 text-[10px] font-bold text-black">{quality.startsWith("4K") ? "4K" : "HD"}</span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute bottom-[32px] right-0 z-10 w-[190px] rounded-[3px] border border-hairline bg-surface-2/95 p-2 text-sm"
                  >
                    <p className="px-2 pb-1 text-2xs font-bold uppercase text-muted">Quality</p>
                    {QUALITIES.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          show(q);
                        }}
                        className={`block w-full rounded-[2px] px-2 py-1 text-left hover:bg-pill-hover ${q === quality ? "text-brand" : ""}`}
                      >
                        {q} {q.startsWith("4K") && <span className="text-2xs text-brand">PREMIUM</span>}
                      </button>
                    ))}
                    <p className="mt-2 px-2 pb-1 text-2xs font-bold uppercase text-muted">Speed</p>
                    <div className="flex flex-wrap gap-1 px-1">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`rounded-[2px] px-2 py-0.5 ${s === speed ? "bg-brand text-black" : "bg-pill hover:bg-pill-hover"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={onTheater} aria-label="Theater mode" aria-pressed={theater} className={`hidden md:block ${theater ? "text-brand" : "hover:text-brand"}`}>
              <RectangleHorizontal className="h-5 w-5" />
            </button>
            <button onClick={fullscreen} aria-label="Fullscreen" className="hover:text-brand">
              {full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
