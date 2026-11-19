'use client';

import { useState } from 'react';
import { useTikTok } from '@/context/TikTokContext';
import { exploreCategories } from '@/data/seed-tiktok';
import VideoThumb from '@/components/feed/VideoThumb';

export default function ExplorePage() {
  const { videos } = useTikTok();
  const [cat, setCat] = useState<string>('All');
  const list = cat === 'All' ? videos : videos.filter((v) => v.category === cat || (cat === 'Tech & Gadgets' && v.tags.includes('techtok')));
  return (
    <div className="px-4 pb-10 md:px-8">
      <div className="sticky top-0 z-20 -mx-4 bg-canvas px-4 pb-3 pt-[72px] md:-mx-8 md:px-8 md:pt-6">
        <h1 className="mb-3 text-24 font-bold md:pr-[420px]">Explore</h1>
        <div className="flex gap-3 overflow-x-auto no-scrollbar" role="tablist">
          {exploreCategories.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={`h-9 shrink-0 rounded-md px-3 text-15 font-semibold ${cat === c ? 'bg-ink text-canvas' : 'bg-pill text-ink hover:bg-pill-hover'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((v) => <VideoThumb key={v.id} video={v} />)}
      </div>
      {list.length === 0 && <p className="py-20 text-center text-muted">No videos in this category yet.</p>}
    </div>
  );
}
