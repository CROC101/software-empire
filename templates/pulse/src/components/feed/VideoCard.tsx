'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Captions, Ellipsis, Heart, Music2, Pause, Play, Volume2, VolumeX, Clapperboard } from 'lucide-react';
import { Art, Avatar, Verified } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { tags as knownTags, ME } from '@/data/seed-tiktok';
import type { Video } from '@/types/tiktok';
import ActionRail from './ActionRail';
import CommentsDrawer from './CommentsDrawer';
import ShareModal from './ShareModal';
import ProductAnchorSheet, { ProductAnchor } from './ProductAnchorSheet';

const mmss = (s: number) => (Number.isFinite(s) ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '00:00');
const SPEEDS = [1, 1.5, 2, 0.5];

export function TagLink({ tag }: { tag: string }) {
  return <Link href={knownTags.includes(tag) ? `/tag/${tag}` : `/search?q=${encodeURIComponent('#' + tag)}`} className="font-semibold hover:underline">#{tag}</Link>;
}

export default function VideoCard({ video, active, muted, setMuted, compact = false }: {
  video: Video; active: boolean; muted: boolean; setMuted: (m: boolean) => void; compact?: boolean;
}) {
  const { liked, toggleLike, comments, following, toggleFollow } = useTikTok();
  const { creator, music } = useLookup();
  const { toast } = useUI();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [cc, setCc] = useState(false);
  const [more, setMore] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sheet, setSheet] = useState<'comments' | 'share' | 'shop' | null>(null);
  const c = creator(video.handle);
  const mu = music(video.musicId);
  const commentCount = video.comments + comments.filter((x) => x.videoId === video.id && x.handle === ME).length;
  const isFollowing = following.includes(video.handle);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [active]);

  useEffect(() => { if (ref.current) ref.current.playbackRate = SPEEDS[speed]; }, [speed]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const onDouble = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Date.now();
    setBursts((b) => [...b, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
    if (!liked.includes(video.id)) toggleLike(video.id);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (ref.current && dur) ref.current.currentTime = ((e.clientX - r.left) / r.width) * dur;
  };

  return (
    <article
      className="relative h-full w-full overflow-hidden rounded-card bg-stage"
      style={{ backgroundImage: `radial-gradient(circle at 50% 40%, ${video.hue[1]}cc, #1a1520 70%)` }}
      aria-label={`Video by ${c.name}`}
    >
      {/* the 9:16 player */}
      <section className="absolute inset-0 flex justify-center" onClick={togglePlay} onDoubleClick={onDouble}>
        <div className="relative h-full max-w-full aspect-[9/16]">
          <Art hue={video.hue} className="absolute inset-0 h-full w-full" seed={Number(video.id.replace(/\D/g, '')) || 1} />
          <video
            ref={ref} src={video.src} muted={muted} loop playsInline preload={active ? 'auto' : 'none'}
            className="absolute inset-0 h-full w-full object-cover"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          />
          {cc && <p className="absolute bottom-28 left-1/2 w-[80%] -translate-x-1/2 rounded bg-black/60 px-2 py-1 text-center text-14 text-white">{video.caption}</p>}
        </div>
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.span key={b.id} className="pointer-events-none absolute text-brand" style={{ left: b.x - 40, top: b.y - 40 }}
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }} animate={{ scale: 1.2, opacity: 1, rotate: 0 }} exit={{ scale: 1.6, opacity: 0, y: -60 }}>
              <Heart size={80} className="fill-brand" />
            </motion.span>
          ))}
        </AnimatePresence>
      </section>

      {/* caption block */}
      <div className="pointer-events-none absolute bottom-[80px] left-5 right-[84px] z-10 flex flex-col items-start text-white [&>*]:pointer-events-auto">
        {video.productIds.length > 0 ? (
          <div className="mb-[14px]"><ProductAnchor productIds={video.productIds} onOpen={() => setSheet('shop')} /></div>
        ) : (
          <Link href="/upload" className="mb-[14px] flex h-6 items-center gap-1 rounded-btn bg-dim px-2 text-12 font-semibold">
            <Clapperboard size={14} /> Studio · Editing made easy
          </Link>
        )}
        <div className="flex max-w-full items-center gap-2">
          <Link href={`/@${c.handle}`} className="shrink-0"><Avatar hue={c.hue} name={c.name} size={24} /></Link>
          <Link href={`/@${c.handle}`} className="flex min-w-0 items-center gap-1 text-16 leading-[22px] font-bold hover:underline">
            <span className="truncate">{c.name}</span>{c.verified && <Verified />}
          </Link>
          {c.handle !== ME && (
            <button onClick={() => toggleFollow(c.handle)} className={`h-7 shrink-0 rounded-btn px-2 text-13 font-semibold ${isFollowing ? 'bg-glass' : 'bg-brand'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {!compact && (
          <p className="mt-3 line-clamp-2 text-14 leading-[18px] font-semibold">
            {video.caption} {video.tags.map((tg) => <span key={tg}><TagLink tag={tg} /> </span>)}
          </p>
        )}
        {mu && (
          <Link href={`/music/${mu.id}`} className="mt-3 flex max-w-full items-center gap-2 text-14 font-semibold hover:underline">
            <Music2 size={14} className="shrink-0" /><span className="truncate">{mu.title} - {mu.artist}</span>
          </Link>
        )}
      </div>

      <ActionRail video={video} commentCount={commentCount} onComments={() => setSheet('comments')} onShare={() => setSheet('share')} shareOpen={sheet === 'share'} />

      {/* controls */}
      <div className="absolute bottom-0 left-2 right-2 z-10 h-[56px]">
        <div role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} tabIndex={0} onClick={seek}
          onKeyDown={(e) => { if (ref.current && e.key === 'ArrowRight') ref.current.currentTime += 5; if (ref.current && e.key === 'ArrowLeft') ref.current.currentTime -= 5; }}
          className="group/bar absolute left-0 right-0 top-0 h-1 cursor-pointer rounded-full bg-glass-2">
          <div className="h-full rounded-full bg-brand" style={{ width: `${dur ? (t / dur) * 100 : 0}%` }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex h-[52px] items-center text-white">
          <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="flex h-9 w-9 items-center justify-center">
            {playing ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white" />}
          </button>
          <span className="ml-1 text-15 font-semibold tabular-nums">{mmss(t)} / {mmss(dur)}</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setSpeed((s) => (s + 1) % SPEEDS.length)} aria-label="Playback speed" className="hidden h-8 w-[52px] items-center justify-center text-15 font-bold sm:flex">{SPEEDS[speed].toFixed(1)}x</button>
            <button onClick={() => setCc((x) => !x)} aria-label="Captions" aria-pressed={cc} className={`hidden h-9 w-9 items-center justify-center sm:flex ${cc ? 'text-white' : 'text-white/60'}`}><Captions size={20} /></button>
            <button onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'} className="flex h-9 w-9 items-center justify-center">{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
            <div className="relative">
              <button onClick={() => setMore((m) => !m)} aria-label="More options" aria-expanded={active ? more : undefined} className="flex h-12 w-12 items-center justify-center"><Ellipsis size={24} /></button>
              {more && (
                <div role="menu" className="absolute bottom-12 right-0 w-48 rounded-md bg-card py-1 text-14 text-ink shadow-xl">
                  <Link role="menuitem" href={`/@${c.handle}/video/${video.id}`} className="block px-4 py-2 hover:bg-pill">Open video page</Link>
                  <button role="menuitem" onClick={() => { setMore(false); toast("We'll show fewer videos like this"); }} className="block w-full px-4 py-2 text-left hover:bg-pill">Not interested</button>
                  <button role="menuitem" onClick={() => { setMore(false); toast('Thanks for reporting'); }} className="block w-full px-4 py-2 text-left hover:bg-pill">Report</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CommentsDrawer open={sheet === 'comments'} onClose={() => setSheet(null)} videoId={video.id} count={commentCount} />
      <ShareModal open={sheet === 'share'} onClose={() => setSheet(null)} path={`/@${c.handle}/video/${video.id}`} />
      {video.productIds.length > 0 && <ProductAnchorSheet open={sheet === 'shop'} onClose={() => setSheet(null)} productIds={video.productIds} />}
    </article>
  );
}
