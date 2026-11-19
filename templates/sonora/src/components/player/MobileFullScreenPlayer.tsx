'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, ListMusic, Mic2, SlidersHorizontal } from 'lucide-react';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { albumHref, artistHref } from '@/lib/links';
import Cover from '@/components/ui/Cover';
import { useCoverColor } from '@/components/ui/Hero';
import { Scrubber, TransportButtons } from './Controls';

export default function MobileFullScreenPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.track;
  const color = useCoverColor(t?.cover);
  const line = t?.lyrics.filter((l) => l.time <= p.currentTime).at(-1);

  return (
    <AnimatePresence>
      {open && t && (
        <motion.div
          role="dialog"
          aria-label="Now playing"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto px-6 pb-8 pt-[max(16px,env(safe-area-inset-top))] md:hidden"
          style={{ background: `linear-gradient(180deg, ${color} 0%, #121212 100%)` }}
        >
          <div className="flex items-center justify-between">
            <button type="button" aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center">
              <ChevronDown size={26} />
            </button>
            <div className="min-w-0 text-center">
              <p className="text-[11px] uppercase tracking-widest text-white/70">Playing from</p>
              <Link href={p.context?.href ?? '/queue'} onClick={onClose} className="block truncate text-sm font-bold">
                {p.context?.name ?? 'Your queue'}
              </Link>
            </div>
            <span className="w-10" />
          </div>

          <div className="mt-8 flex flex-1 items-center justify-center">
            <Cover cover={t.cover} label={t.albumName} big className="aspect-square w-full max-w-[340px]" />
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link href={albumHref(t)} onClick={onClose} className="block truncate text-2xl font-bold">
                {t.title}
              </Link>
              <Link href={artistHref(t)} onClick={onClose} className="block truncate text-base text-white/70">
                {t.artistName}
              </Link>
            </div>
            <button type="button" aria-label="Like" onClick={() => lib.toggleLike(t)} className={lib.isLiked(t.id) ? 'text-green' : 'text-white'}>
              <Heart size={26} fill={lib.isLiked(t.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mt-4">
            <Scrubber />
          </div>
          <div className="mt-2">
            <TransportButtons big />
          </div>

          <div className="mt-6 flex items-center justify-between text-white/80">
            <Link href="/account#equalizer" onClick={onClose} aria-label="Equalizer">
              <SlidersHorizontal size={22} />
            </Link>
            <Link href="/lyrics" onClick={onClose} aria-label="Lyrics">
              <Mic2 size={22} />
            </Link>
            <Link href="/queue" onClick={onClose} aria-label="Queue">
              <ListMusic size={22} />
            </Link>
          </div>

          <Link href="/lyrics" onClick={onClose} className="mt-6 block rounded-lg p-4" style={{ background: color }}>
            <p className="text-sm font-bold">Lyrics preview</p>
            <p className="mt-2 text-xl font-bold">{line?.text ?? t.lyrics[0]?.text ?? '♪'}</p>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
