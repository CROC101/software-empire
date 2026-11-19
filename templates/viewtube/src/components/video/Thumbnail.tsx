'use client';

import { useRef, useState } from 'react';
import type { Video } from '@/types/youtube';
import { clock, cx } from '@/lib/format';

/** Gradient artwork thumbnail; never 404s. With `preview`, hovering plays a muted clip you can scrub with the mouse. */
export default function Thumbnail({
  video,
  preview = false,
  className = '',
  rounded = 'rounded-card',
  vertical = false,
}: {
  video: Video;
  preview?: boolean;
  className?: string;
  rounded?: string;
  vertical?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [frac, setFrac] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vid = useRef<HTMLVideoElement>(null);

  const enter = () => {
    if (!preview) return;
    timer.current = setTimeout(() => setHover(true), 350);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setHover(false);
    setFrac(0);
  };
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setFrac(f);
    const el = vid.current;
    if (el && Number.isFinite(el.duration)) el.currentTime = f * el.duration;
  };

  const { from, to, glyph } = video.thumb;
  return (
    <div
      className={cx('@container relative overflow-hidden bg-raised', vertical ? 'aspect-[9/16]' : 'aspect-video', rounded, hover && 'rounded-none', 'transition-[border-radius] duration-200', className)}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onMouseMove={move}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 78% 18%, rgba(255,255,255,.28), transparent 42%), linear-gradient(135deg, ${from}, ${to})`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[.13]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,.45)]" style={{ fontSize: 'clamp(22px, 9cqw, 64px)' }}>
          {glyph}
        </span>
      </div>
      <span className="absolute bottom-2 left-2 max-w-[70%] truncate text-[11px] font-bold uppercase tracking-wide text-white/80">{video.category}</span>
      {hover && (
        <video ref={vid} src={video.src} muted autoPlay playsInline preload="auto" className="absolute inset-0 h-full w-full bg-black object-cover" />
      )}
      {video.isLive ? (
        <span className="absolute right-1 bottom-1 rounded bg-brand px-1 py-px text-xs font-medium text-white">LIVE</span>
      ) : (
        !vertical && <span className="tabular absolute right-1 bottom-1 rounded bg-black/80 px-1 py-px text-xs font-medium text-white">{clock(video.duration)}</span>
      )}
      {hover && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
          <div className="h-full bg-brand" style={{ width: `${frac * 100}%` }} />
        </div>
      )}
    </div>
  );
}
