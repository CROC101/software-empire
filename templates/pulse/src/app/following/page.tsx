'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Art, Avatar, Verified } from '@/components/common/Visuals';
import { useTikTok } from '@/context/TikTokContext';
import { creators, ME } from '@/data/seed-tiktok';
import ForYouFeed from '@/components/feed/ForYouFeed';
import type { Creator, Video } from '@/types/tiktok';

function CreatorCard({ c, video, plain }: { c: Creator; video?: Video; plain?: boolean }) {
  const { following, toggleFollow } = useTikTok();
  const ref = useRef<HTMLVideoElement>(null);
  const on = following.includes(c.handle);
  return (
    <div
      className="relative aspect-[226/302] overflow-hidden rounded-md bg-skeleton"
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => ref.current?.pause()}
    >
      <Link href={`/@${c.handle}`} aria-label={`${c.name} profile`} className="absolute inset-0">
        {!plain && <Art hue={video?.hue ?? c.hue} seed={c.followers % 97} className="absolute inset-0 h-full w-full" />}
        {!plain && video && <video ref={ref} src={video.src} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />}
        {!plain && <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />}
      </Link>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-[18px] pb-5 text-center text-white">
        <Avatar hue={c.hue} name={c.name} size={48} className="ring-2 ring-white/70" />
        <h3 className="mt-1.5 w-full truncate text-18 leading-6 font-bold">{c.name}</h3>
        <p className="flex max-w-full items-center gap-1 text-14 leading-[18px] font-semibold"><span className="truncate">{c.handle}</span>{c.verified && <Verified size={12} />}</p>
        <button onClick={() => toggleFollow(c.handle)} className={`pointer-events-auto mt-2 h-9 w-[164px] max-w-full rounded-sm text-18 font-bold ${on ? 'bg-glass backdrop-blur' : 'bg-brand'}`}>
          {on ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}

export default function FollowingPage() {
  const { videos, following, hydrated } = useTikTok();
  const [tab, setTab] = useState<'accounts' | 'videos'>('accounts');
  const list = creators.filter((c) => c.handle !== ME);
  const feed = videos.filter((v) => following.includes(v.handle));

  if (tab === 'videos') {
    return (
      <div className="relative">
        <button onClick={() => setTab('accounts')} className="absolute left-6 top-6 z-30 h-9 rounded-md bg-glass px-3 text-14 font-semibold text-white backdrop-blur">← Accounts</button>
        <ForYouFeed videos={feed} empty={<p className="text-muted">Follow creators to see their videos here.</p>} />
      </div>
    );
  }
  return (
    <div className="relative pb-10 pt-5">
      <div className="mx-auto grid max-w-[714px] grid-cols-[repeat(auto-fill,226px)] gap-[18px] max-lg:mx-0">
        {list.map((c, i) => <div key={c.handle} className={i >= 42 ? 'lg:hidden' : undefined /* captured desktop list stops at 14 rows of 3 */}><CreatorCard c={c} plain={i >= 42 /* captured tail cards load without a preview */} video={videos.find((v) => v.handle === c.handle)} /></div>)}
      </div>
      <button onClick={() => setTab('videos')} className="mx-auto mt-6 flex h-9 items-center rounded-md bg-pill px-3 text-14 font-semibold hover:bg-pill-hover max-lg:ml-0 sm:absolute sm:right-6 sm:top-5 sm:mt-0 lg:static lg:mt-6">Videos from following {hydrated ? `(${feed.length})` : ''}</button>
    </div>
  );
}
