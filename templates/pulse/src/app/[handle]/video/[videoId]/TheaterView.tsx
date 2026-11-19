'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Music2, X } from 'lucide-react';
import { Art, Avatar, Verified } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import ActionRail from '@/components/feed/ActionRail';
import { CommentsList } from '@/components/feed/CommentsDrawer';
import ShareModal from '@/components/feed/ShareModal';
import ProductCard from '@/components/shop/ProductCard';
import { TagLink } from '@/components/feed/VideoCard';
import { fmtCount, fmtTime } from '@/lib/format';
import { ME } from '@/data/seed-tiktok';

export default function TheaterView({ id }: { id: string }) {
  const { comments, following, toggleFollow, hydrated, products } = useTikTok();
  const { video, creator, music } = useLookup();
  const router = useRouter();
  const [share, setShare] = useState(false);
  const v = video(id);
  if (!v) return <div className="p-16 text-center text-muted">{hydrated ? <>This video is unavailable. <Link href="/" className="text-brand">Back to For You</Link></> : 'Loading…'}</div>;

  const c = creator(v.handle);
  const mu = music(v.musicId);
  const tagged = products.filter((p) => v.productIds.includes(p.id));
  const count = comments.filter((x) => x.videoId === v.id).length || v.comments;
  const words = v.caption.split(/(#[\w.]+)/g);

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
      <section className="relative flex h-[78dvh] shrink-0 items-center justify-center overflow-hidden bg-stage lg:h-full lg:flex-1">
        <Art hue={v.hue} seed={5} className="absolute inset-0 h-full w-full scale-125 opacity-50 blur-3xl" />
        <video key={v.id} src={v.src} autoPlay muted loop playsInline controls className="relative h-full aspect-[9/16] max-w-full object-cover" />
        <button onClick={() => (history.length > 1 ? router.back() : router.push('/'))} aria-label="Close" className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-glass text-white backdrop-blur"><X size={22} /></button>
        <ActionRail video={v} commentCount={count} onShare={() => setShare(true)} onComments={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })} />
      </section>

      <aside className="flex w-full flex-col bg-canvas lg:w-[500px] lg:shrink-0 lg:overflow-y-auto">
        <div className="space-y-3 border-b border-line p-5 lg:pt-20">
          <div className="flex items-center gap-3">
            <Link href={`/@${c.handle}`}><Avatar hue={c.hue} name={c.name} size={40} /></Link>
            <Link href={`/@${c.handle}`} className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-17 font-bold">{c.handle}{c.verified && <Verified />}</p>
              <p className="text-13 text-muted">{c.name} · {fmtTime(v.createdAt)}</p>
            </Link>
            {v.handle !== ME && <button onClick={() => toggleFollow(v.handle)} className={`h-9 w-24 rounded-btn text-15 font-semibold ${following.includes(v.handle) ? 'bg-pill' : 'bg-brand text-white'}`}>{following.includes(v.handle) ? 'Following' : 'Follow'}</button>}
          </div>
          <p className="text-15">{words.map((w, i) => (w.startsWith('#') ? <TagLink key={i} tag={w.slice(1)} /> : w))}</p>
          {mu && <Link href={`/music/${mu.id}`} className="flex items-center gap-1 text-14 hover:underline"><Music2 size={14} />{mu.title} - {mu.artist}</Link>}
          <p className="text-13 text-muted">{fmtCount(v.views)} views</p>
        </div>
        {tagged.length > 0 && (
          <div className="border-b border-line p-5">
            <h2 className="mb-3 text-15 font-bold">Products in this video</h2>
            <div className="grid grid-cols-2 gap-3">{tagged.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        )}
        <div id="comments" className="flex min-h-[420px] flex-1 flex-col">
          <h2 className="px-5 pt-4 text-15 font-bold">Comments ({fmtCount(count)})</h2>
          <CommentsList videoId={v.id} />
        </div>
      </aside>
      <ShareModal open={share} onClose={() => setShare(false)} path={`/@${v.handle}/video/${v.id}`} />
    </div>
  );
}
