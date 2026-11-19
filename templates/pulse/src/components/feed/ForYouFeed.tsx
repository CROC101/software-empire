'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTikTok } from '@/context/TikTokContext';
import type { Video } from '@/types/tiktok';
import VideoCard from './VideoCard';

/** Vertical snap feed. Each card fills the viewport minus a 16px (8px below 1024px) frame. */
export default function ForYouFeed({ videos, empty, showTip = false }: { videos: Video[]; empty?: React.ReactNode; showTip?: boolean }) {
  const { onboarded, finishOnboarding, hydrated } = useTikTok();
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setIndex(Number((e.target as HTMLElement).dataset.index)); }),
      { root, threshold: 0.6 },
    );
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [videos.length]);

  const go = useCallback((dir: 1 | -1) => {
    const root = scroller.current;
    const next = root?.querySelector<HTMLElement>(`[data-index="${index + dir}"]`);
    next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [index]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.querySelector('[role="dialog"]')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  if (videos.length === 0) return <div className="flex h-dvh items-center justify-center p-6">{empty}</div>;

  return (
    <div className="relative h-dvh">
      <div ref={scroller} className="h-dvh snap-y snap-mandatory overflow-y-scroll pt-2 no-scrollbar lg:pt-4" aria-label="Video feed">
        {videos.map((v, i) => (
          <div key={v.id} data-index={i} className="h-[calc(100dvh-16px)] snap-start scroll-mt-2 px-2 lg:h-[calc(100dvh-32px)] lg:scroll-mt-4 lg:px-4">
            <VideoCard video={v} active={i === index} muted={muted} setMuted={setMuted} />
          </div>
        ))}
        <div className="h-2 lg:h-4" />
      </div>

      <div className="absolute right-[32px] top-[calc(50%-48px)] z-20 flex flex-col gap-4 lg:right-[40px]">
        <button aria-label="Previous video" disabled={index === 0} onClick={() => go(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-glass text-white backdrop-blur hover:bg-glass-2 disabled:opacity-40"><ChevronUp size={20} /></button>
        <button aria-label="Next video" disabled={index >= videos.length - 1} onClick={() => go(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-glass text-white backdrop-blur hover:bg-glass-2 disabled:opacity-40"><ChevronDown size={20} /></button>
      </div>

      {showTip && hydrated && !onboarded && (
        <div className="absolute inset-0 z-30 hidden items-center justify-center bg-black/80 p-4 pt-24 md:flex lg:hidden" role="dialog" aria-label="How to browse">
          <div className="flex w-[420px] flex-col items-center text-center text-white">
            <svg width="112" height="96" viewBox="0 0 112 96" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <rect x="20" y="8" width="44" height="80" rx="22" />
              <path d="M42 26v14" />
              <path d="M64 46c8-8 22-8 30 0s8 22 0 30" />
              <path d="M88 20l6 8 6-8M88 92l6-8 6 8" />
            </svg>
            <p className="mt-10 text-[20px] leading-[25px] font-semibold">Scroll, use the ↑ ↓ keys, or click the arrows on the right to browse your feed.</p>
            <button onClick={finishOnboarding} className="mt-11 h-11 w-[140px] rounded-pill bg-brand text-16 font-bold">Got it</button>
          </div>
        </div>
      )}
      <Link href="/explore" className="sr-only">Explore more videos</Link>
    </div>
  );
}
