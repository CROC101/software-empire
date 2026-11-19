'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Hash } from 'lucide-react';
import { Art, Avatar, Verified } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import VideoThumb from '@/components/feed/VideoThumb';
import ProductCard from '@/components/shop/ProductCard';
import { creators, liveStreams, tags } from '@/data/seed-tiktok';
import { fmtCount } from '@/lib/format';

const TABS = ['Top', 'Shop Products', 'Videos', 'Users', 'LIVE', 'Hashtags'] as const;

function Results() {
  const q = (useSearchParams().get('q') ?? '').trim();
  const ql = q.toLowerCase().replace(/^[#@]/, '');
  const { videos, products, following, toggleFollow } = useTikTok();
  const { creator, video } = useLookup();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Top');
  const has = (s: string) => s.toLowerCase().includes(ql);

  const vids = videos.filter((v) => has(v.caption) || v.tags.some(has) || has(v.handle) || has(v.category));
  const prods = products.filter((p) => has(p.name) || has(p.category) || has(p.description));
  const users = creators.filter((c) => has(c.handle) || has(c.name) || has(c.bio));
  const lives = liveStreams.filter((s) => has(s.title) || has(s.handle));
  const hashes = tags.filter(has);

  const userRow = (c: (typeof creators)[number]) => (
    <li key={c.handle} className="flex items-center gap-3 py-2">
      <Link href={`/@${c.handle}`}><Avatar hue={c.hue} name={c.name} size={56} /></Link>
      <Link href={`/@${c.handle}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-16 font-bold">{c.handle}{c.verified && <Verified />}</p>
        <p className="truncate text-14 text-muted">{c.name} · <b className="text-ink">{fmtCount(c.followers)}</b> Followers</p>
      </Link>
      <button onClick={() => toggleFollow(c.handle)} className={`h-9 w-[104px] rounded-btn text-15 font-semibold ${following.includes(c.handle) ? 'bg-pill' : 'bg-brand text-white'}`}>{following.includes(c.handle) ? 'Following' : 'Follow'}</button>
    </li>
  );
  const prodGrid = (list: typeof prods) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>;
  const vidGrid = (list: typeof vids) => <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{list.map((v) => <VideoThumb key={v.id} video={v} />)}</div>;
  const empty = <p className="py-16 text-center text-muted">No results for “{q}”. Try another keyword.</p>;

  let body: React.ReactNode;
  if (!q) body = <p className="py-16 text-center text-muted">Type something in the search box to begin.</p>;
  else if (tab === 'Top') body = vids.length + prods.length + users.length === 0 ? empty : (
    <div className="space-y-8">
      {users.length > 0 && <section><h2 className="mb-1 text-17 font-bold">Accounts</h2><ul>{users.slice(0, 3).map(userRow)}</ul></section>}
      {prods.length > 0 && <section><h2 className="mb-3 text-17 font-bold">Shop products</h2>{prodGrid(prods.slice(0, 5))}</section>}
      {vids.length > 0 && <section><h2 className="mb-3 text-17 font-bold">Videos</h2>{vidGrid(vids)}</section>}
    </div>
  );
  else if (tab === 'Shop Products') body = prods.length ? prodGrid(prods) : empty;
  else if (tab === 'Videos') body = vids.length ? vidGrid(vids) : empty;
  else if (tab === 'Users') body = users.length ? <ul className="max-w-[680px]">{users.map(userRow)}</ul> : empty;
  else if (tab === 'LIVE') body = lives.length ? (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {lives.map((s, i) => { const sv = video(s.videoId); const c = creator(s.handle); return (
        <Link key={s.id} href="/live" className="block">
          <div className="relative aspect-video overflow-hidden rounded-md">{sv && <Art hue={sv.hue} seed={i} className="absolute inset-0 h-full w-full" />}<span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 text-11 font-bold text-white">LIVE</span></div>
          <p className="mt-2 truncate text-14 font-semibold">{s.title}</p><p className="text-12 text-muted">{c.name} · {fmtCount(s.viewers)} watching</p>
        </Link>); })}
    </div>
  ) : empty;
  else body = hashes.length ? (
    <ul className="max-w-[680px]">
      {hashes.map((t) => (
        <li key={t}><Link href={`/tag/${t}`} className="flex items-center gap-3 py-2 hover:bg-pill">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pill"><Hash size={24} /></span>
          <span><span className="block text-16 font-bold">#{t}</span><span className="text-14 text-muted">{videos.filter((v) => v.tags.includes(t)).length} videos</span></span>
        </Link></li>
      ))}
    </ul>
  ) : empty;

  return (
    <div className="px-4 pb-10 pt-[64px] md:px-8 md:pt-6">
      <div className="sticky top-0 z-10 -mx-4 bg-canvas px-4 md:-mx-8 md:px-8">
        <div className="flex gap-6 overflow-x-auto border-b border-line no-scrollbar md:pr-[400px]" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative h-11 shrink-0 text-16 font-semibold ${tab === t ? '' : 'text-muted'}`}>
              {t}{tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
            </button>
          ))}
        </div>
      </div>
      {q && <p className="my-4 text-14 text-muted">Results for <b className="text-ink">“{q}”</b></p>}
      {body}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="p-10 text-muted">Searching…</div>}><Results /></Suspense>;
}
