'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CoverArt, TrackItem } from '@/types/spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import Cover from './Cover';
import PlayButton from './PlayButton';

export interface CardProps {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  cover: CoverArt;
  round?: boolean;
  tracks?: TrackItem[];
  contextName?: string;
  explicit?: boolean;
  /** fixed width carousel card (home) or fluid grid card */
  fixed?: boolean;
}

export default function MediaCard({ href, title, subtitle, cover, round, tracks, contextName, explicit, fixed }: CardProps) {
  const p = usePlayer();
  const playingHere = !!tracks?.length && p.isPlaying && tracks.some((t) => p.isCurrent(t.id)) && p.context?.href === href;
  return (
    <motion.div initial="rest" whileHover="hover" animate="rest" className={`group relative shrink-0 rounded-lg p-3 transition-colors hover:bg-hover ${fixed ? 'w-[178px]' : 'w-full'}`}>
      <Link href={href} className="block" aria-label={title}>
        <div className="relative">
          <Cover cover={cover} label={round ? title : undefined} round={round} className="aspect-square w-full" />
          {tracks?.length ? (
            <motion.div
              variants={{ rest: { y: 8, opacity: playingHere ? 1 : 0 }, hover: { y: 0, opacity: 1 } }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-2 right-2"
            >
              <PlayButton
                size={48}
                playing={playingHere}
                label={`Play ${title}`}
                onClick={() => (playingHere ? p.togglePlay() : p.playTracks(tracks, 0, { name: contextName ?? title, href }))}
              />
            </motion.div>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-base leading-[22px] text-white">{title}</p>
      </Link>
      {subtitle && (
        <div className="mt-[5px] line-clamp-2 text-sm leading-5 text-subdued">
          {explicit && <span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-xs bg-white/10 text-xs font-bold text-white">E</span>}
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}
