'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Chip, EmptyState } from '@/components/ui';
import VideoCard from '@/components/video/VideoCard';
import Thumbnail from '@/components/video/Thumbnail';
import { useYouTube } from '@/context/YouTubeContext';
import { CATEGORIES } from '@/data/seed-youtube';
import { compact } from '@/lib/format';

const CHIPS = ['All', ...CATEGORIES, 'Live'] as const;

export default function HomePage() {
  const { videos } = useYouTube();
  const [chip, setChip] = useState<(typeof CHIPS)[number]>('All');

  const list = useMemo(
    () =>
      videos.filter(
        (v) => !v.isShort && v.visibility === 'Public' && (chip === 'All' || (chip === 'Live' ? v.isLive : v.category === chip)),
      ),
    [videos, chip],
  );
  const shorts = useMemo(() => videos.filter((v) => v.isShort), [videos]);

  return (
    <div className="@container">
      <div className="sticky top-14 z-20 bg-canvas/95 backdrop-blur">
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-3 sm:px-6">
          {CHIPS.map((c) => (
            <Chip key={c} active={chip === c} onClick={() => setChip(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Zap size={96} strokeWidth={1.5} />} title="Nothing here yet" text="No videos in this category. Try another chip." />
      ) : (
        <motion.div
          key={chip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-x-4 gap-y-10 px-4 pt-3 pb-10 sm:px-6 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1240px]:grid-cols-4"
        >
          {list.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </motion.div>
      )}

      {chip === 'All' && (
        <section className="border-t border-line px-4 pt-6 pb-16 sm:px-6" aria-label="Shorts">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Zap size={24} className="fill-brand text-brand" /> Shorts
          </h2>
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {shorts.map((s) => (
              <Link key={s.id} href={`/shorts?s=${s.id}`} className="w-[180px] shrink-0 sm:w-[210px]">
                <Thumbnail video={s} vertical />
                <p className="mt-2 line-clamp-2 text-base font-medium">{s.title}</p>
                <p className="tabular text-sm text-muted">{compact(s.views)} views</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
