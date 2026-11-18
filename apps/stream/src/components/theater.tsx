import { cn } from "@empire/ui";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { clock } from "@/lib/time";
import { frame, frameAt } from "@/lib/youtube";
import type { Player } from "./player";

/** What the bar shows, read from the player a few times a second. */
export type Clock = {
  t: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
};

/** Where along the bar the pointer is, as 0-1. */
export function ratioAt(x: number, width: number) {
  return width > 0 ? Math.min(1, Math.max(0, x / width)) : 0;
}

/** Number key n jumps to n * 10% of the video, like YouTube. */
export function jumpTo(key: string, duration: number) {
  return /^[0-9]$/.test(key) && duration > 0 ? (Number(key) / 10) * duration : null;
}

const TICK_MS = 250;

/**
 * Our own controls under the frame (YouTube's are off with controls: 0). Nothing is drawn over
 * the frame itself (the hover preview opens below the bar): YouTube's terms forbid covering,
 * cropping or hiding its player.
 */
export function TheaterBar({
  p,
  id,
  stage,
}: {
  p: Player;
  id: string;
  stage: RefObject<HTMLElement | null>;
}) {
  const [c, setC] = useState<Clock | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const [hover, setHover] = useState<{ x: number; ratio: number } | null>(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const read = () => setC(p.read());
    read();
    const timer = setInterval(read, TICK_MS);
    return () => clearInterval(timer);
  }, [p]);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, [stage]);

  const duration = c?.duration ?? 0;
  const t = scrub ?? c?.t ?? 0;
  const done = duration > 0 ? (t / duration) * 100 : 0;
  const buffered = (c?.buffered ?? 0) * 100;
  const commit = () => {
    if (scrub !== null) p.seek(scrub);
    setScrub(null);
  };
  const muted = c?.muted || c?.volume === 0;

  return (
    <div className="grid gap-1 px-3 pt-2 pb-1 [:fullscreen_&]:text-[var(--em-ink-0)]">
      <div
        className="relative flex h-6 items-center"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover({ x: e.clientX - r.left, ratio: ratioAt(e.clientX - r.left, r.width) });
        }}
        onPointerLeave={() => setHover(null)}
      >
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={1}
          value={Math.min(t, Math.max(1, duration))}
          aria-label="ตำแหน่งในวิดีโอ"
          aria-valuetext={`${clock(t)} จาก ${clock(duration)}`}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          className="st-timeline h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, var(--primary) ${done}%, color-mix(in oklab, currentColor 40%, transparent) ${done}% ${buffered}%, color-mix(in oklab, currentColor 18%, transparent) ${buffered}%)`,
          }}
        />
        {hover && duration > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-7 z-10 w-32 -translate-x-1/2 overflow-hidden rounded-md border border-[color-mix(in_oklab,var(--foreground)_14%,transparent)] bg-[var(--card)] text-center text-xs font-semibold text-[var(--foreground)] shadow-xl"
            style={{ left: `clamp(4rem, ${hover.x}px, calc(100% - 4rem))` }}
          >
            <img
              src={frame(id, frameAt(hover.ratio, 1))}
              alt=""
              className="aspect-video w-full object-cover"
            />
            <span className="block py-0.5 tabular-nums">{clock(hover.ratio * duration)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Hud label="ถอย 10 วินาที" onClick={() => p.seek(Math.max(0, (c?.t ?? 0) - 10))}>
          <RotateCcw className="size-5" aria-hidden />
        </Hud>
        <Hud label={p.playing ? "หยุด" : "เล่น"} onClick={p.playing ? p.pause : p.resume}>
          {p.playing ? (
            <Pause className="size-6" aria-hidden />
          ) : (
            <Play className="size-6" aria-hidden />
          )}
        </Hud>
        <Hud label="ข้าม 10 วินาที" onClick={() => p.seek((c?.t ?? 0) + 10)}>
          <RotateCw className="size-5" aria-hidden />
        </Hud>
        <Hud label={muted ? "เปิดเสียง" : "ปิดเสียง"} onClick={() => p.setMuted(!muted)}>
          {muted ? (
            <VolumeX className="size-5" aria-hidden />
          ) : (
            <Volume2 className="size-5" aria-hidden />
          )}
        </Hud>
        {/* phones use their own volume buttons */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={muted ? 0 : (c?.volume ?? 100)}
          aria-label="ระดับเสียง"
          onChange={(e) => p.setVolume(Number(e.target.value))}
          className="st-timeline hidden h-1 w-24 cursor-pointer appearance-none rounded-full bg-[color-mix(in_oklab,currentColor_25%,transparent)] sm:block"
        />
        <span className="ml-1 text-sm whitespace-nowrap tabular-nums sm:ml-2">
          {clock(t)} / {clock(duration)}
        </span>
        <span className="flex-1" />
        <Hud
          label={full ? "ออกจากเต็มจอ" : "เต็มจอ"}
          onClick={() => void toggleFullscreen(stage.current)}
        >
          {full ? (
            <Minimize className="size-5" aria-hidden />
          ) : (
            <Maximize className="size-5" aria-hidden />
          )}
        </Hud>
      </div>
    </div>
  );
}

export function toggleFullscreen(el: HTMLElement | null) {
  if (document.fullscreenElement) return document.exitFullscreen();
  return el?.requestFullscreen().catch(() => undefined);
}

function Hud({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-md",
        "hover:bg-[color-mix(in_oklab,currentColor_12%,transparent)]",
      )}
    >
      {children}
    </button>
  );
}
