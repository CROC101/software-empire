'use client';

import { Pause, Play } from 'lucide-react';

export default function PlayButton({
  playing,
  onClick,
  size = 56,
  className = '',
  label,
}: {
  playing: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  className?: string;
  label?: string;
}) {
  const icon = Math.round(size * 0.4);
  return (
    <button
      type="button"
      aria-label={label ?? (playing ? 'Pause' : 'Play')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-full bg-green text-black shadow-[0_8px_8px_rgba(0,0,0,.3)] transition hover:scale-105 hover:bg-green-hi active:scale-95 ${className}`}
    >
      {playing ? <Pause size={icon} fill="black" strokeWidth={0} /> : <Play size={icon} fill="black" strokeWidth={0} className="ml-[2px]" />}
    </button>
  );
}
