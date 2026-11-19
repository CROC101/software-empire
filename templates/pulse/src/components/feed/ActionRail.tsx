'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bookmark, Check, Heart, MessageCircleMore, Plus, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { fmtCount } from '@/lib/format';
import { ME } from '@/data/seed-tiktok';
import type { Video } from '@/types/tiktok';

export default function ActionRail({ video, onComments, onShare, commentCount, shareOpen = false }: { video: Video; onComments: () => void; onShare: () => void; commentCount: number; shareOpen?: boolean }) {
  const [tip, setTip] = useState(false);
  const { liked, saved, following, toggleLike, toggleSave, toggleFollow } = useTikTok();
  const { creator, music } = useLookup();
  const c = creator(video.handle);
  const mu = music(video.musicId);
  const isLiked = liked.includes(video.id);
  const isSaved = saved.includes(video.id);
  const isFollowing = following.includes(video.handle);

  // icon + count share one button so the count is its accessible name (e.g. "10.9K"); label goes in the tooltip
  const btn = (label: string, count: number, icon: React.ReactNode, on: boolean, onClick: () => void, popup?: boolean, kind: 'dialog' | 'menu' = 'dialog') => (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} title={label} aria-pressed={popup === undefined ? on : undefined}
      aria-haspopup={popup === undefined ? undefined : kind} aria-expanded={popup} className="flex h-[42px] flex-col items-center text-white drop-shadow">
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="mt-[3px] text-12 leading-[17px] font-bold">{fmtCount(count)}</span>
    </motion.button>
  );

  return (
    <section className="absolute bottom-[110px] right-[22px] z-10 flex w-[43px] flex-col items-center gap-[10px]" aria-label="Video actions">
      <div className="relative mb-2">
        <Link href={`/@${c.handle}`} aria-label={`${c.name} profile`}><Avatar hue={c.hue} name={c.name} size={40} className="ring-1 ring-white" /></Link>
        {c.handle !== ME && (
          <button onClick={() => toggleFollow(c.handle)} aria-label={isFollowing ? `Unfollow ${c.name}` : `Follow ${c.name}`}
            className={`absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full ${isFollowing ? 'bg-white text-brand' : 'bg-brand text-white'}`}>
            {isFollowing ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
          </button>
        )}
      </div>
      {btn('Like', video.likes + (isLiked ? 1 : 0), <Heart size={20} className={isLiked ? 'fill-brand text-brand' : 'fill-white'} />, isLiked, () => toggleLike(video.id))}
      {btn('Comments', commentCount, <MessageCircleMore size={20} className="fill-white text-white [&>path:not(:first-child)]:stroke-black" />, false, onComments)}
      <div className="relative">
        {btn('Save to Favorites', video.saves + (isSaved ? 1 : 0), <Bookmark size={20} className={isSaved ? 'fill-gold text-gold' : 'fill-white'} />, isSaved, () => { if (!isSaved) toggleSave(video.id); setTip((t) => !t); }, tip)}
        {tip && (
          <div role="dialog" aria-label="Favorites" className="absolute bottom-0 right-[52px] z-30 w-[200px] rounded-lg bg-card p-3 text-left text-ink shadow-lg ring-1 ring-line">
            <p className="text-14 font-semibold">{isSaved ? 'Saved to Favorites' : 'Removed from Favorites'}</p>
            <div className="mt-2 flex gap-2 text-13">
              <Link href="/profile" className="font-semibold text-brand">View</Link>
              {isSaved && <button onClick={() => { toggleSave(video.id); setTip(false); }} className="text-muted hover:text-ink">Undo</button>}
            </div>
          </div>
        )}
      </div>
      {btn('Share', video.shares, <Share size={20} className="text-white" strokeWidth={2.6} />, false, onShare, shareOpen, 'menu')}
      {mu && (
        <Link href={`/music/${mu.id}`} aria-label={`Sound: ${mu.title}`} className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#222] animate-spin-slow">
          <span className="h-4 w-4 rounded-full" style={{ background: `linear-gradient(135deg, ${mu.hue[0]}, ${mu.hue[1]})` }} />
        </Link>
      )}
    </section>
  );
}
