'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Art, Avatar } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { creators } from '@/data/seed-tiktok';

const ACTIVITY = ['Active now', 'Liked a video', 'Shared a product', 'Posted 2h ago', 'Watching LIVE'];

function FriendRow({ handle, i }: { handle: string; i: number }) {
  const { creator } = useLookup();
  const { videos, openThread, sendMessage } = useTikTok();
  const { toast } = useUI();
  const [text, setText] = useState('');
  const f = creator(handle);
  const v = videos[(i * 3 + 1) % videos.length];
  const act = ACTIVITY[i % ACTIVITY.length];
  return (
    <li className="rounded-lg border border-line bg-card p-4">
      <div className="flex items-center gap-3">
        <Link href={`/@${f.handle}`} className="relative">
          <Avatar hue={f.hue} name={f.name} size={48} />
          {act === 'Active now' && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-[#22c55e]" />}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/@${f.handle}`} className="text-16 font-bold hover:underline">{f.name}</Link>
          <p className="text-13 text-muted">@{f.handle}</p>
        </div>
        <span className="rounded-pill bg-brand/10 px-2 py-0.5 text-12 font-semibold text-brand">{act}</span>
      </div>
      <Link href={`/@${v.handle}/video/${v.id}`} className="mt-3 flex gap-3 rounded-md bg-pill p-2 hover:bg-pill-hover">
        <Art hue={v.hue} seed={i + 3} className="h-20 w-[45px] shrink-0 rounded-sm" />
        <span className="line-clamp-3 text-14">{v.caption}</span>
      </Link>
      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; const id = openThread(f.handle); sendMessage(id, text.trim()); setText(''); toast(`Sent to ${f.name}`); }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Quick reply to ${f.name}...`} aria-label={`Reply to ${f.name}`} className="h-10 min-w-0 flex-1 rounded-pill bg-pill px-4 text-14 outline-none" />
        <button type="submit" aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"><Send size={16} /></button>
      </form>
    </li>
  );
}

export default function FriendsPage() {
  const { following } = useTikTok();
  const mutual = creators.filter((c) => !c.isShop && following.includes(c.handle) && c.handle !== 'bts_official_bighit');
  const suggested = creators.filter((c) => !c.isShop && !following.includes(c.handle) && c.handle !== 'crocbyte').slice(0, 3);
  return (
    <div className="mx-auto max-w-[640px] px-4 pb-10 pt-[72px] md:pt-6">
      <h1 className="text-24 font-bold">Friends</h1>
      <p className="mb-4 text-14 text-muted">Mutual friends and what they are up to</p>
      <ul className="space-y-3">{mutual.map((f, i) => <FriendRow key={f.handle} handle={f.handle} i={i} />)}</ul>
      {mutual.length === 0 && <p className="py-10 text-center text-muted">No mutual friends yet.</p>}
      <h2 className="mb-2 mt-8 text-17 font-bold">Suggested friends</h2>
      <ul className="space-y-3">{suggested.map((f, i) => <FriendRow key={f.handle} handle={f.handle} i={i + 2} />)}</ul>
    </div>
  );
}
