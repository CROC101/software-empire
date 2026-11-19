'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play, X } from 'lucide-react';
import { useYouTube } from '@/context/YouTubeContext';
import { normalize } from './Sidebar';

export default function MiniPlayer() {
  const { mini, setMini, getVideo, getChannel } = useYouTube();
  const path = normalize(usePathname());
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const video = getVideo(mini?.videoId);
  const show = !!mini && !!video && path !== '/watch' && path !== '/shorts';

  useEffect(() => {
    setTime(mini?.time ?? 0);
  }, [mini]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => undefined);
    else el.pause();
  };

  const expandHref = video ? `/watch?v=${video.id}${mini?.list ? `&list=${mini.list}` : ''}&t=${Math.floor(time)}` : '/';

  return (
    <AnimatePresence>
      {show && video && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          className="fixed right-3 bottom-3 z-[90] w-[400px] max-w-[calc(100vw-24px)] overflow-hidden rounded-card bg-elevated shadow-[0_8px_30px_rgba(0,0,0,.6)]"
          role="region"
          aria-label="Mini player"
        >
          <div className="group relative aspect-video bg-black">
            <video
              ref={ref}
              src={video.src}
              autoPlay
              playsInline
              className="h-full w-full"
              onLoadedMetadata={(e) => {
                e.currentTarget.currentTime = mini?.time ?? 0;
              }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={toggle}
            />
            <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <Link href={expandHref} aria-label="Expand" className="absolute top-2 left-2 grid h-9 w-9 place-items-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20">
              <Maximize2 size={20} />
            </Link>
            <button type="button" aria-label="Close player" onClick={() => setMini(null)} className="absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20">
              <X size={22} />
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={toggle}
              className="absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20"
            >
              {playing ? <Pause size={34} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
            </button>
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
              <div className="h-full bg-brand" style={{ width: `${(time / (ref.current?.duration || video.duration)) * 100}%` }} />
            </div>
          </div>
          <Link href={expandHref} className="block px-3 py-2.5">
            <p className="truncate text-sm font-medium">{video.title}</p>
            <p className="truncate text-xs text-muted">{getChannel(video.channelId)?.name}</p>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
