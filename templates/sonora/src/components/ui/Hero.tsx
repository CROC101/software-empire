'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CoverArt } from '@/types/spotify';
import { extractDominantColor } from '@/lib/color';

/** Dominant colour of a cover: the seeded colour, or the colour sampled from a real image. */
export function useCoverColor(cover: CoverArt | undefined): string {
  const [c, setC] = useState(cover?.color ?? '#535353');
  useEffect(() => {
    if (!cover) return;
    setC(cover.color);
    if (cover.image) void extractDominantColor(cover.image).then((x) => x && setC(x));
  }, [cover]);
  return c;
}

/** Ambient backdrop: linear-gradient(180deg, color 0%, #121212 100%), cross-fading when the colour changes. */
export function AmbientGradient({ color, height = 332, className = '' }: { color: string; height?: number | string; className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 ${className}`}
      style={{ height }}
      initial={false}
      animate={{ backgroundColor: color }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="h-full w-full bg-[linear-gradient(180deg,rgba(18,18,18,0)_0%,#121212_100%)]" />
    </motion.div>
  );
}

/** Detail-page header (album / playlist / artist / genre): art + kind + big title + meta row. */
export function DetailHero({ color, art, kind, title, children }: { color: string; art?: React.ReactNode; kind?: string; title: string; children?: React.ReactNode }) {
  // sized by the view's width, not the window's: at tablet width the view is only ~416px wide
  const size = title.length > 22 ? 'text-[32px] @2xl:text-[56px]' : title.length > 12 ? 'text-[32px] @2xl:text-[72px]' : 'text-[32px] @2xl:text-hero';
  return (
    <header className="@container relative">
      <motion.div aria-hidden className="absolute inset-0" initial={false} animate={{ backgroundColor: color }} transition={{ duration: 0.6 }}>
        <div className="h-full w-full bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.5)_100%)]" />
      </motion.div>
      <div className="relative mx-auto flex max-w-[1955px] flex-col gap-4 px-4 pb-6 pt-8 md:flex-row md:items-end md:px-4 @2xl:min-h-[269px] @2xl:gap-6 @2xl:px-6">
        {art && <div className="mx-auto h-[216px] w-[216px] shrink-0 md:mx-0 md:h-32 md:w-32 @2xl:h-[215px] @2xl:w-[215px]">{art}</div>}
        <div className="flex min-w-0 flex-col justify-end gap-2">
          {kind && <span className="text-sm font-medium text-white">{kind}</span>}
          <h1 className={`font-title ${size} break-words font-extrabold leading-[1.15] tracking-[-0.04em] text-white`}>{title}</h1>
          {children && <div className="flex flex-wrap items-center gap-1 text-sm text-white/70">{children}</div>}
        </div>
      </div>
    </header>
  );
}

/** Darker band below the hero holding the action buttons. */
export function ActionBand({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <motion.div aria-hidden className="absolute inset-x-0 top-0 h-[232px]" initial={false} animate={{ backgroundColor: color }} transition={{ duration: 0.6 }}>
        <div className="h-full w-full bg-[linear-gradient(180deg,rgba(0,0,0,.6)_0%,#121212_100%)]" />
      </motion.div>
      <div className="relative flex items-center gap-6 px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
