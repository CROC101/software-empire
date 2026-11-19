'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, Download, ListPlus, Scissors, Share2, ThumbsDown, ThumbsUp, TvMinimalPlay, X } from 'lucide-react';
import CustomVideoPlayer, { type PlayerHandle } from '@/components/player/CustomVideoPlayer';
import CommentSection from '@/components/video/CommentSection';
import RelatedVideoCard from '@/components/video/RelatedVideoCard';
import SaveToPlaylistModal from '@/components/video/SaveToPlaylistModal';
import ShareModal from '@/components/video/ShareModal';
import { ChannelAvatar, Chip, EmptyState, PillButton, Verified, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { clock, compact, cx, fullDate, timeAgo } from '@/lib/format';
import type { Video } from '@/types/youtube';

function Description({ video, onSeek }: { video: Video; onSeek: (t: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cx('mt-3 rounded-card bg-soft p-3 text-sm', !open && 'cursor-pointer hover:bg-white/20')}
      onClick={() => !open && setOpen(true)}
    >
      <p className="tabular font-medium">
        {open ? `${video.views.toLocaleString()} views` : `${compact(video.views)} views`}
        <span className="ml-2">{open ? fullDate(video.publishedAt) : timeAgo(video.publishedAt)}</span>
        {video.hashtags.slice(0, 3).map((h) => (
          <Link key={h} href={`/results?search_query=${encodeURIComponent(`#${h}`)}`} onClick={(e) => e.stopPropagation()} className="ml-2 text-link hover:underline">
            #{h}
          </Link>
        ))}
      </p>
      <p className={cx('mt-1 whitespace-pre-wrap', !open && 'line-clamp-2')}>{video.description}</p>
      {open && (
        <>
          {video.chapters.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-base font-bold">Chapters</h3>
              <ul className="space-y-1">
                {video.chapters.map((c) => (
                  <li key={c.time}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(c.time);
                      }}
                      className="tabular text-link hover:underline"
                    >
                      {clock(c.time)}
                    </button>{' '}
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4">
            {video.hashtags.map((h) => (
              <Link key={h} href={`/results?search_query=${encodeURIComponent(`#${h}`)}`} className="mr-2 text-link hover:underline">
                #{h}
              </Link>
            ))}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="mt-2 font-medium"
      >
        {open ? 'Show less' : '...more'}
      </button>
    </div>
  );
}

function WatchInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const yt = useYouTube();
  const id = sp.get('v');
  const listId = sp.get('list');
  const startAt = Number(sp.get('t') ?? 0) || 0;
  const video = yt.getVideo(id);
  const ch = yt.getChannel(video?.channelId);
  const list = listId ? yt.getList(listId) : undefined;
  const player = useRef<PlayerHandle>(null);
  const [theater, setTheater] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [share, setShare] = useState<null | { clip: boolean }>(null);
  const [filter, setFilter] = useState<'all' | 'channel' | 'related'>('all');
  const lastTime = useRef(startAt);
  const current = useRef<string | undefined>(undefined);

  // Record history and drop any mini player for this page; restore it when leaving.
  useEffect(() => {
    if (!video) return;
    yt.recordHistory(video.id);
    yt.setMini(null);
    current.current = video.id;
    lastTime.current = startAt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  useEffect(
    () => () => {
      if (current.current && lastTime.current > 1) yt.setMini({ videoId: current.current, time: lastTime.current, list: listId ?? undefined });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const queueIds = list ? list.videoIds : yt.queue;
  const nextId = useMemo(() => {
    if (!video) return undefined;
    const i = queueIds.indexOf(video.id);
    if (queueIds.length && i < queueIds.length - 1) return queueIds[i + 1];
    return undefined;
  }, [queueIds, video]);

  const goNext = useCallback(() => {
    if (nextId) router.push(`/watch?v=${nextId}${listId ? `&list=${listId}` : ''}`);
  }, [nextId, listId, router]);

  const related = useMemo(() => {
    if (!video) return [];
    return yt.videos
      .filter((v) => v.id !== video.id && !v.isShort && v.visibility === 'Public')
      .filter((v) => (filter === 'channel' ? v.channelId === video.channelId : filter === 'related' ? v.category === video.category || v.hashtags.some((h) => video.hashtags.includes(h)) : true))
      .sort((a, b) => Number(b.category === video.category) - Number(a.category === video.category) || b.views - a.views);
  }, [yt.videos, video, filter]);

  if (!video || !ch) {
    return (
      <EmptyState icon={<TvMinimalPlay size={96} strokeWidth={1.25} />} title="This video isn't available" text="The link may be broken or the video was removed.">
        <Link href="/" className="rounded-pill bg-raised px-4 py-2 text-sm font-medium hover:bg-hover">
          Go to Home
        </Link>
      </EmptyState>
    );
  }

  const liked = yt.liked.includes(video.id);
  const disliked = yt.disliked.includes(video.id);
  const subscribed = yt.subscribed.includes(ch.id);
  const seek = (t: number) => {
    player.current?.seekTo(t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const playerEl = (
    <CustomVideoPlayer
      key={video.id}
      video={video}
      playerRef={player}
      startAt={startAt}
      theater={theater}
      onTheater={() => setTheater((t) => !t)}
      onMini={(time) => {
        yt.setMini({ videoId: video.id, time, list: listId ?? undefined });
        current.current = undefined;
        router.push('/');
      }}
      onNext={nextId ? goNext : undefined}
      onEnded={goNext}
      onTime={(t) => (lastTime.current = t)}
    />
  );

  const panel = (list || yt.queue.length > 0) && (
    <div className="mb-4 overflow-hidden rounded-card border border-line">
      <div className="flex items-start justify-between bg-elevated px-4 py-3">
        <div>
          <h3 className="text-xl font-bold">{list ? list.title : 'Queue'}</h3>
          <p className="text-xs text-muted">
            {list && !list.builtIn ? (yt.getChannel(list.ownerId)?.name ?? 'You') : 'You'} - {Math.max(1, queueIds.indexOf(video.id) + 1)} / {queueIds.length}
          </p>
        </div>
        {!list && (
          <button type="button" aria-label="Clear queue" onClick={() => yt.clearQueue()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-soft">
            <X size={20} />
          </button>
        )}
      </div>
      <div className="thin-scroll max-h-[400px] space-y-1 overflow-y-auto p-2">
        {queueIds.map((qid, i) => {
          const v = yt.getVideo(qid);
          return v ? <RelatedVideoCard key={qid} video={v} index={i} active={qid === video.id} href={`/watch?v=${qid}${listId ? `&list=${listId}` : ''}`} /> : null;
        })}
      </div>
    </div>
  );

  return (
    <div className={cx('mx-auto', !theater && 'max-w-[1754px] px-0 pt-0 sm:px-6 sm:pt-6')}>
      {theater && <div className="bg-black">{playerEl}</div>}
      <div className={cx('flex flex-col gap-6 lg:flex-row', theater && 'mx-auto max-w-[1754px] px-0 pt-6 sm:px-6')}>
        <div className="min-w-0 flex-1 px-3 sm:px-0">
          {!theater && <div className="-mx-3 sm:mx-0">{playerEl}</div>}
          <h1 className="mt-3 text-xl leading-7 font-bold tracking-[-0.01em]">{video.title}</h1>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ChannelAvatar channel={ch} size={40} />
              <div className="mr-3 min-w-0">
                <Link href={`/channel/${ch.id}`} className="flex items-center gap-1 text-base font-medium">
                  <span className="truncate">{ch.name}</span>
                  {ch.verified && <Verified />}
                </Link>
                <p className="tabular text-xs text-muted">{compact(ch.subscribers + (subscribed ? 1 : 0))} subscribers</p>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <PillButton
                  variant={subscribed ? 'soft' : 'white'}
                  onClick={() => {
                    yt.toggleSubscribe(ch.id);
                    toast(subscribed ? 'Subscription removed' : 'Subscription added');
                  }}
                >
                  {subscribed ? (
                    <>
                      <BellRing size={20} /> Subscribed
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </PillButton>
              </motion.div>
            </div>

            <div className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 xl:mx-0 xl:px-0">
              <div className="flex h-9 shrink-0 items-center rounded-pill bg-raised">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  aria-pressed={liked}
                  aria-label="Like this video"
                  onClick={() => yt.toggleLike(video.id)}
                  className="tabular flex h-full items-center gap-2 rounded-l-pill pr-3 pl-4 text-sm font-medium hover:bg-hover"
                >
                  <ThumbsUp size={20} className={cx(liked && 'fill-ink')} />
                  {compact(video.likes + (liked ? 1 : 0))}
                </motion.button>
                <span className="h-6 w-px bg-white/20" />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  aria-pressed={disliked}
                  aria-label="Dislike this video"
                  onClick={() => yt.toggleDislike(video.id)}
                  className="flex h-full items-center rounded-r-pill pr-4 pl-3 hover:bg-hover"
                >
                  <ThumbsDown size={20} className={cx(disliked && 'fill-ink')} />
                </motion.button>
              </div>
              <PillButton onClick={() => setShare({ clip: false })}>
                <Share2 size={20} /> Share
              </PillButton>
              <PillButton
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = video.src;
                  a.download = `${video.id}.mp4`;
                  a.target = '_blank';
                  a.rel = 'noopener';
                  a.click();
                  toast('Download started');
                }}
              >
                <Download size={20} /> Download
              </PillButton>
              <PillButton onClick={() => setShare({ clip: true })}>
                <Scissors size={20} /> Clip
              </PillButton>
              <PillButton onClick={() => setSaveOpen(true)}>
                <ListPlus size={20} /> Save
              </PillButton>
            </div>
          </div>

          <Description video={video} onSeek={seek} />

          <div className="lg:hidden">
            <div className="mt-6">{panel}</div>
          </div>

          <CommentSection videoId={video.id} channelId={ch.id} />
        </div>

        <aside className="w-full shrink-0 px-3 pb-10 sm:px-0 lg:w-[402px]">
          <div className="hidden lg:block">{panel}</div>
          <div className="no-scrollbar mb-3 flex gap-3 overflow-x-auto">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Chip>
            <Chip active={filter === 'channel'} onClick={() => setFilter('channel')}>
              From {ch.name}
            </Chip>
            <Chip active={filter === 'related'} onClick={() => setFilter('related')}>
              Related
            </Chip>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {related.map((v) => (
                <RelatedVideoCard key={v.id} video={v} />
              ))}
              {related.length === 0 && <p className="py-6 text-center text-sm text-muted">No more videos here.</p>}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      <SaveToPlaylistModal videoId={video.id} open={saveOpen} onClose={() => setSaveOpen(false)} />
      <ShareModal videoId={video.id} open={!!share} startChecked={!!share?.clip} currentTime={player.current?.getTime() ?? lastTime.current} onClose={() => setShare(null)} />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={null}>
      <WatchInner />
    </Suspense>
  );
}
