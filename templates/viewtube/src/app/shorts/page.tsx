'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, MessageSquareText, Music2, Pause, Play, Repeat2, Share2, ThumbsDown, ThumbsUp, Volume2, VolumeX, X } from 'lucide-react';
import type { Video } from '@/types/youtube';
import CommentSection from '@/components/video/CommentSection';
import ShareModal from '@/components/video/ShareModal';
import { ChannelAvatar, PillButton, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, cx } from '@/lib/format';

function RailButton({ label, icon, onClick, active }: { label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.85 }}
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cx('grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur md:bg-raised md:hover:bg-hover', active && 'bg-ink! text-canvas')}
      >
        {icon}
      </motion.button>
      <span className="tabular text-xs font-medium drop-shadow">{label}</span>
    </div>
  );
}

function Short({ video, muted, setMuted, onComments, onShare }: { video: Video; muted: boolean; setMuted: (m: boolean) => void; onComments: () => void; onShare: () => void }) {
  const yt = useYouTube();
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const ch = yt.getChannel(video.channelId);
  const liked = yt.liked.includes(video.id);
  const disliked = yt.disliked.includes(video.id);
  const subscribed = ch ? yt.subscribed.includes(ch.id) : false;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const v = vid.current;
        if (!v) return;
        if (e.isIntersecting) {
          v.currentTime = 0;
          v.play().catch(() => undefined);
          yt.recordHistory(video.id);
        } else v.pause();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const toggle = () => {
    const v = vid.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  };

  return (
    <section ref={wrap} id={`short-${video.id}`} data-short className="flex h-full snap-start snap-always items-center justify-center py-0 sm:py-4">
      <div className="flex h-full items-end gap-4">
        <div className="relative h-full overflow-hidden bg-black sm:rounded-card" style={{ aspectRatio: '9 / 16', maxWidth: '100vw' }}>
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${video.thumb.from}, ${video.thumb.to})` }} />
          <video
            ref={vid}
            src={video.src}
            loop
            playsInline
            muted={muted}
            preload="metadata"
            onClick={toggle}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/50 to-transparent p-3">
            <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/20">
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(!muted)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/20">
              {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-16 pb-5 pr-20 md:pr-4">
            {ch && (
              <div className="mb-2 flex items-center gap-2">
                <ChannelAvatar channel={ch} size={32} />
                <Link href={`/channel/${ch.id}`} className="truncate text-sm font-medium">
                  @{ch.handle}
                </Link>
                <PillButton variant={subscribed ? 'soft' : 'white'} className="h-8! px-3!" onClick={() => yt.toggleSubscribe(ch.id)}>
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </PillButton>
              </div>
            )}
            <p className="mb-2 line-clamp-2 text-base">{video.title}</p>
            <div className="flex items-center gap-2 overflow-hidden text-sm">
              <Music2 size={14} className="shrink-0" />
              <div className="overflow-hidden">
                <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
                  <span>{video.track}</span>
                  <span aria-hidden>{video.track}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
            <div className="h-full bg-brand" style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Mobile overlay rail */}
          <div className="absolute right-2 bottom-20 flex flex-col gap-4 md:hidden">
            {Rail()}
          </div>
        </div>
        <div className="hidden flex-col gap-4 pb-2 md:flex">{Rail()}</div>
      </div>
    </section>
  );

  function Rail() {
    return (
      <>
        <RailButton label={compact(video.likes + (liked ? 1 : 0))} active={liked} onClick={() => yt.toggleLike(video.id)} icon={<ThumbsUp size={22} className={cx(liked && 'fill-current')} />} />
        <RailButton label="Dislike" active={disliked} onClick={() => yt.toggleDislike(video.id)} icon={<ThumbsDown size={22} className={cx(disliked && 'fill-current')} />} />
        <RailButton label={String(yt.getComments(video.id).length)} onClick={onComments} icon={<MessageSquareText size={22} />} />
        <RailButton label="Share" onClick={onShare} icon={<Share2 size={22} />} />
        <RailButton label="Remix" onClick={() => toast('Remix: sound saved to your library')} icon={<Repeat2 size={22} />} />
        <span className="mx-auto h-10 w-10 rounded-chip border-2 border-white/80" style={{ background: `linear-gradient(135deg, ${video.thumb.from}, ${video.thumb.to})` }} aria-hidden />
      </>
    );
  }
}

function ShortsInner() {
  const { videos } = useYouTube();
  const sp = useSearchParams();
  const shorts = videos.filter((v) => v.isShort);
  const feed = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [comments, setComments] = useState<Video | null>(null);
  const [share, setShare] = useState<Video | null>(null);

  const step = (dir: 1 | -1) => feed.current?.scrollBy({ top: dir * feed.current.clientHeight, behavior: 'smooth' });

  useEffect(() => {
    const s = sp.get('s');
    if (s) document.getElementById(`short-${s}`)?.scrollIntoView();
  }, [sp]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowDown') (e.preventDefault(), step(1));
      if (e.key === 'ArrowUp') (e.preventDefault(), step(-1));
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="relative">
      <div ref={feed} className="no-scrollbar h-[calc(100dvh-56px)] snap-y snap-mandatory overflow-y-scroll" aria-label="Shorts feed">
        {shorts.map((v) => (
          <div key={v.id} className="h-[calc(100dvh-56px)]">
            <Short video={v} muted={muted} setMuted={setMuted} onComments={() => setComments(v)} onShare={() => setShare(v)} />
          </div>
        ))}
      </div>

      <div className="fixed top-1/2 right-6 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        <button type="button" aria-label="Previous video" onClick={() => step(-1)} className="grid h-14 w-14 place-items-center rounded-full bg-raised hover:bg-hover">
          <ChevronUp size={26} />
        </button>
        <button type="button" aria-label="Next video" onClick={() => step(1)} className="grid h-14 w-14 place-items-center rounded-full bg-raised hover:bg-hover">
          <ChevronDown size={26} />
        </button>
      </div>

      <AnimatePresence>
        {comments && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="thin-scroll fixed top-14 right-0 bottom-0 z-40 w-full overflow-y-auto border-l border-line bg-elevated px-4 pb-8 sm:w-[420px]"
            aria-label="Comments drawer"
          >
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-elevated px-4 py-2">
              <span className="text-base font-bold">Comments</span>
              <button type="button" aria-label="Close comments" onClick={() => setComments(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-soft">
                <X size={22} />
              </button>
            </div>
            <CommentSection videoId={comments.id} channelId={comments.channelId} compactHeader />
          </motion.aside>
        )}
      </AnimatePresence>
      {share && <ShareModal videoId={share.id} open onClose={() => setShare(null)} />}
    </div>
  );
}

export default function ShortsPage() {
  return (
    <Suspense fallback={null}>
      <ShortsInner />
    </Suspense>
  );
}
