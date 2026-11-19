'use client';

import { useTikTok } from '@/context/TikTokContext';
import VideoThumb from './VideoThumb';
import type { Hue, Video } from '@/types/tiktok';
import { Art } from '@/components/common/Visuals';
import { fmtCount } from '@/lib/format';

/** Header + video grid used by the hashtag and sound pages. */
export default function VideoGridPage({ title, subtitle, hue, icon, match }: { title: string; subtitle: string; hue: Hue; icon: React.ReactNode; match: (v: Video) => boolean }) {
  const { videos } = useTikTok();
  const list = videos.filter(match);
  const views = list.reduce((a, v) => a + v.views, 0);
  return (
    <div className="px-4 pb-16 pt-[64px] md:px-8 md:pt-9">
      <header className="flex items-center gap-6 md:pr-[360px]">
        <span className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center overflow-hidden rounded-lg text-white md:h-[172px] md:w-[172px]">
          <Art hue={hue} seed={7} className="absolute inset-0 h-full w-full" /><span className="relative">{icon}</span>
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-[28px] leading-9 font-bold">{title}</h1>
          <p className="mt-1 text-15 text-muted">{subtitle}</p>
          <p className="mt-2 text-15"><b>{fmtCount(views)}</b> views · <b>{list.length}</b> videos</p>
        </div>
      </header>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {list.map((v) => <VideoThumb key={v.id} video={v} />)}
      </div>
      {list.length === 0 && <p className="py-16 text-center text-muted">No videos yet.</p>}
    </div>
  );
}
