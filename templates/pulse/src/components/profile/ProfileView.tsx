'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bookmark, Grid3x3, Heart, Link2, Lock, MoreHorizontal, Settings, Share2, ShoppingBag, UserPlus } from 'lucide-react';
import { Art, Avatar, Verified } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import VideoThumb from '@/components/feed/VideoThumb';
import ProductCard from '@/components/shop/ProductCard';
import ShareModal from '@/components/feed/ShareModal';
import { ME } from '@/data/seed-tiktok';
import { fmtCount } from '@/lib/format';

const TABS = [
  { id: 'videos', label: 'Videos', icon: Grid3x3 },
  { id: 'shop', label: 'Showcase Shop', icon: ShoppingBag },
  { id: 'favorites', label: 'Favorites', icon: Bookmark },
  { id: 'liked', label: 'Liked', icon: Heart },
] as const;

export default function ProfileView({ handle }: { handle: string }) {
  const { videos, products, liked, saved, following, toggleFollow, openThread } = useTikTok();
  const { creator } = useLookup();
  const router = useRouter();
  const c = creator(handle);
  const mine = handle === ME;
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('videos');
  const [sort, setSort] = useState<'Latest' | 'Popular' | 'Oldest'>('Latest');
  const [share, setShare] = useState(false);
  const on = following.includes(handle);

  const own = videos.filter((v) => v.handle === handle);
  const sorted = sort === 'Popular' ? [...own].sort((a, b) => b.views - a.views) : sort === 'Oldest' ? [...own].reverse() : own;
  const showcase = products.filter((p) => p.shopHandle === handle || own.some((v) => v.productIds.includes(p.id)));
  const totalLikes = c.likes + own.reduce((a, v) => a + (liked.includes(v.id) ? 1 : 0), 0);
  const priv = !mine && (tab === 'favorites' || tab === 'liked');
  const grid = tab === 'videos' ? sorted : tab === 'favorites' ? videos.filter((v) => saved.includes(v.id)) : videos.filter((v) => liked.includes(v.id));

  return (
    <div className="px-4 pb-16 pt-[64px] md:px-8 md:pt-9">
      <header className="flex flex-col gap-5 sm:flex-row sm:gap-7 md:pr-[360px]">
        <span className="shrink-0 md:hidden"><Avatar hue={c.hue} name={c.name} size={116} /></span>
        <span className="hidden shrink-0 md:block"><Avatar hue={c.hue} name={c.name} size={172} /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-24 leading-8 font-bold">{c.name}</h1>
            <h2 className="flex items-center gap-1 border-l border-line pl-3 text-17 font-normal text-muted">{c.handle}{c.verified && <Verified size={16} />}</h2>
          </div>
          <h2 className="mt-2 flex gap-5 text-16 font-normal lg:mt-1">
            <span><b>{fmtCount(c.following)}</b> <span className="text-muted">Following</span></span>
            <span><b>{fmtCount(c.followers + (on ? 1 : 0))}</b> <span className="text-muted">Followers</span></span>
            <span><b>{fmtCount(totalLikes)}</b> <span className="text-muted">Likes</span></span>
          </h2>
          <div className="mt-4 flex flex-wrap gap-2 lg:mt-3">
            {mine ? (
              <>
                <Link href="/upload" className="flex h-10 items-center rounded-btn bg-brand px-4 text-15 font-semibold text-white">Upload</Link>
                <Link href="/seller" className="flex h-10 items-center rounded-btn bg-pill px-4 text-15 font-semibold hover:bg-pill-hover">Seller Center</Link>
                <Link href="/orders" className="flex h-10 items-center rounded-btn bg-pill px-4 text-15 font-semibold hover:bg-pill-hover">My Orders</Link>
                <button aria-label="Settings" className="flex h-10 w-10 items-center justify-center rounded-btn bg-pill"><Settings size={18} /></button>
              </>
            ) : (
              <>
                <button onClick={() => toggleFollow(handle)} className={`h-10 w-[164px] rounded-btn text-15 font-semibold ${on ? 'bg-pill' : 'bg-brand text-white'}`}>{on ? 'Following' : 'Follow'}</button>
                <button onClick={() => router.push(`/messages?t=${openThread(handle)}`)} className="h-10 rounded-btn bg-pill px-4 text-15 font-semibold hover:bg-pill-hover">Message</button>
                <button aria-label="Suggested accounts" className="flex h-10 w-10 items-center justify-center rounded-btn bg-pill"><UserPlus size={18} /></button>
              </>
            )}
            <button aria-label="Share profile" onClick={() => setShare(true)} className="flex h-10 w-10 items-center justify-center rounded-btn bg-pill"><Share2 size={18} /></button>
            <button aria-label="More" className="flex h-10 w-10 items-center justify-center rounded-btn bg-pill"><MoreHorizontal size={18} /></button>
          </div>
          <h2 className="mt-3 max-w-[520px] whitespace-pre-line text-16 font-normal">{c.bio || 'No bio yet.'}</h2>
          {c.link && <span className="mt-1 flex items-center gap-1 text-15 font-semibold text-brand"><Link2 size={15} />{c.link}</span>}
        </div>
      </header>

      <div className="mt-6 flex items-end justify-between gap-4 border-b border-line">
        <div className="flex overflow-x-auto no-scrollbar" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`relative flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-17 font-semibold sm:w-[150px] sm:justify-center ${tab === id ? '' : 'text-muted'}`}>
              {(id === 'favorites' || id === 'liked') && !mine ? <Lock size={15} /> : <Icon size={16} />}{label}
              {tab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
            </button>
          ))}
        </div>
        {tab === 'videos' && (
          <div className="mb-1.5 hidden gap-0.5 rounded-md bg-pill p-0.5 sm:flex">
            {(['Latest', 'Popular', 'Oldest'] as const).map((s) => <button key={s} onClick={() => setSort(s)} className={`h-8 rounded-sm px-3 text-14 font-semibold ${sort === s ? 'bg-canvas shadow-sm' : 'text-muted'}`}>{s}</button>)}
          </div>
        )}
      </div>

      <div className="mt-4">
        {priv ? (
          <div className="flex flex-col items-center py-20 text-center"><Lock size={48} className="text-muted-2" /><p className="mt-3 text-18 font-bold">This user&apos;s {tab === 'liked' ? 'liked videos are' : 'favorites are'} private</p></div>
        ) : tab === 'shop' ? (
          showcase.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{showcase.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            : <p className="py-16 text-center text-muted">No products in the showcase yet.</p>
        ) : grid.length ? (
          <>
          {tab === 'videos' && !mine && (
            <section aria-labelledby="pl-h" className="mb-3">
              <h3 id="pl-h" className="text-17 leading-6 font-semibold">Playlists</h3>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                {['Highlights', 'Behind the scenes', 'Live clips'].map((name, i) => (
                  <Link key={name} href={`/@${grid[0].handle}/video/${grid[i % grid.length].id}`} className={`flex h-[94px] items-center gap-3 rounded-md bg-[#0000000d] p-3 hover:bg-pill-hover lg:w-auto ${i ? 'max-lg:hidden' : 'w-[230px] max-w-full'}`}>
                    <Art hue={grid[i % grid.length].hue} seed={i} className="h-[70px] w-[70px] shrink-0 rounded-sm" />
                    <span className="min-w-0"><span className="block truncate text-16 font-bold">{name}</span><span className="text-14 text-muted">{grid.length + 2 * i} posts</span></span>
                  </Link>
                ))}
              </div>
              <h3 className="mt-6 text-17 leading-6 font-semibold">Videos</h3>
            </section>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{grid.map((v) => <VideoThumb key={v.id} video={v} showAuthor={tab !== 'videos'} />)}
            {/* shortcut: older posts aren't in the seed data, so other creators' grids are padded with placeholder tiles to a full 4 rows; replace when real archives exist */}
            {tab === 'videos' && !mine && Array.from({ length: Math.max(0, 24 - grid.length) }, (_, i) => <div key={i} aria-hidden className="aspect-[175/232] rounded-md bg-gradient-to-r from-[#f6f6f6] to-[#e9e9eb]" />)}</div>
          </>
        ) : <p className="py-16 text-center text-muted">{tab === 'videos' ? (mine ? 'Upload your first video' : 'No videos yet') : 'Nothing here yet'}</p>}
      </div>
      <ShareModal open={share} onClose={() => setShare(false)} path={`/@${handle}`} />
    </div>
  );
}
