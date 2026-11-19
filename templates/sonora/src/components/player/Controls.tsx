'use client';

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { fmtClock } from '@/lib/format';

export function Scrubber({ compact }: { compact?: boolean }) {
  const p = usePlayer();
  const max = p.duration || p.track?.duration || 1;
  const fill = `${Math.min(100, (p.currentTime / max) * 100)}%`;
  return (
    <div className="flex w-full items-center gap-2 text-xs tabular-nums text-subdued">
      {!compact && <span className="w-10 text-right">{fmtClock(p.currentTime)}</span>}
      <input
        type="range"
        className="bar min-w-0 flex-1"
        aria-label="Change progress"
        min={0}
        max={max}
        step={0.1}
        value={Math.min(p.currentTime, max)}
        onChange={(e) => p.seek(Number(e.target.value))}
        style={{ '--fill': fill } as React.CSSProperties}
      />
      {!compact && <span className="w-10">{fmtClock(max)}</span>}
    </div>
  );
}

export function TransportButtons({ big }: { big?: boolean }) {
  const p = usePlayer();
  const s = big ? 28 : 16;
  const RepeatIcon = p.repeat === 'one' ? Repeat1 : Repeat;
  const dot = (on: boolean) => on && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-green" />;
  return (
    <div className={`flex items-center justify-center ${big ? 'gap-6' : 'gap-4'}`}>
      <button type="button" aria-label={p.shuffle ? 'Disable shuffle' : 'Enable shuffle'} aria-pressed={p.shuffle} onClick={p.toggleShuffle} className={`relative grid h-8 w-8 place-items-center ${p.shuffle ? 'text-green' : 'text-subdued hover:text-white'}`}>
        <Shuffle size={s} />
        {dot(p.shuffle)}
      </button>
      <button type="button" aria-label="Previous" onClick={p.prev} className="grid h-8 w-8 place-items-center text-subdued hover:text-white">
        <SkipBack size={s} fill="currentColor" />
      </button>
      <button
        type="button"
        aria-label={p.isPlaying ? 'Pause' : 'Play'}
        onClick={p.togglePlay}
        className={`grid place-items-center rounded-full bg-white text-black transition hover:scale-105 ${big ? 'h-16 w-16' : 'h-8 w-8'}`}
      >
        {p.isPlaying ? <Pause size={big ? 28 : 16} fill="black" strokeWidth={0} /> : <Play size={big ? 28 : 16} fill="black" strokeWidth={0} className="ml-[2px]" />}
      </button>
      <button type="button" aria-label="Next" onClick={p.next} className="grid h-8 w-8 place-items-center text-subdued hover:text-white">
        <SkipForward size={s} fill="currentColor" />
      </button>
      <button
        type="button"
        aria-label={`Repeat: ${p.repeat}`}
        onClick={p.cycleRepeat}
        className={`relative grid h-8 w-8 place-items-center ${p.repeat !== 'off' ? 'text-green' : 'text-subdued hover:text-white'}`}
      >
        <RepeatIcon size={s} />
        {dot(p.repeat !== 'off')}
      </button>
    </div>
  );
}
