'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, ChevronRight, ThumbsUp, MessageSquareText } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import PlaylistCard from '@/components/video/PlaylistCard';
import Thumbnail from '@/components/video/Thumbnail';
import { Chip, EmptyState, GradientAvatar, Modal, PillButton, Verified, toast } from '@/components/ui';
import { MY_CHANNEL_ID, useYouTube } from '@/context/YouTubeContext';
import { MUSIC_CHANNEL_ID, SEED_PLAYLISTS } from '@/data/seed-youtube';
import TopicChannel from './TopicChannel';
import { compact, cx, timeAgo } from '@/lib/format';

const TABS = ['Home', 'Videos', 'Shorts', 'Playlists', 'Community'] as const;

export default function ChannelView({ id }: { id: string }) {
  const yt = useYouTube();
  const ch = yt.getChannel(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Home');
  const [sort, setSort] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [about, setAbout] = useState(false);

  const all = useMemo(() => yt.videos.filter((v) => v.channelId === id && v.visibility === 'Public'), [yt.videos, id]);
  const longs = all.filter((v) => !v.isShort);
  const shorts = all.filter((v) => v.isShort);
  const latest = [...longs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const popular = [...longs].sort((a, b) => b.views - a.views);
  const sorted = sort === 'latest' ? latest : sort === 'popular' ? popular : [...latest].reverse();
  const playlists = [...SEED_PLAYLISTS.filter((p) => p.ownerId === id), ...(id === MY_CHANNEL_ID ? yt.playlists : [])];
  const polls = yt.polls.filter((p) => p.channelId === id);

  if (!ch) return <EmptyState icon={null} title="This channel doesn't exist" text="Check the link and try again." />;
  if (id === MUSIC_CHANNEL_ID) return <TopicChannel ch={ch} />;
  const subscribed = yt.subscribed.includes(ch.id);
  const trailer = popular[0];

  const shelf = (title: string, items: typeof longs) =>
    items.length > 0 && (
      <section className="border-b border-line py-6">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {items.map((v) => (
            <div key={v.id} className="w-[251px] shrink-0">
              <VideoCard video={v} showAvatar={false} />
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <div className="mx-auto max-w-[1284px] px-4 pb-16 sm:px-6">
      <div className="mt-4 aspect-[6.2/1] min-h-[64px] overflow-hidden rounded-card" style={{ background: `radial-gradient(circle at 80% 30%, ${ch.banner[1]}, transparent 55%), linear-gradient(120deg, ${ch.banner[0]}, ${ch.banner[1]}66)` }}>
        <div className="flex h-full items-end justify-end p-3 opacity-60">
          <span className="text-2xl font-black tracking-tight text-white/70 sm:text-5xl">{ch.name}</span>
        </div>
      </div>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <GradientAvatar colors={ch.avatar} label={ch.initials} size={160} className="hidden sm:grid" />
        <div className="flex items-center gap-4 sm:block">
          <GradientAvatar colors={ch.avatar} label={ch.initials} size={72} className="sm:hidden" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl leading-tight font-bold sm:text-4xl">
              {ch.name} {ch.verified && <Verified className="h-5 w-5" />}
            </h1>
            <p className="tabular mt-2 text-sm text-muted">
              <span className="font-medium text-ink">@{ch.handle}</span> • {compact(ch.subscribers + (subscribed ? 1 : 0))} subscribers • {all.length} videos
            </p>
            <button type="button" onClick={() => setAbout(true)} className="mt-2 flex max-w-xl items-center text-left text-sm text-muted">
              <span className="line-clamp-1">{ch.bio}</span>
              <ChevronRight size={18} className="shrink-0" />
            </button>
            <div className="mt-3 flex gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <PillButton variant={subscribed ? 'soft' : 'white'} onClick={() => (yt.toggleSubscribe(ch.id), toast(subscribed ? 'Subscription removed' : 'Subscription added'))}>
                  {subscribed ? (
                    <>
                      <BellRing size={20} /> Subscribed
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </PillButton>
              </motion.div>
              {id === MY_CHANNEL_ID && (
                <Link href="/studio" className="inline-flex h-9 items-center rounded-pill bg-raised px-4 text-sm font-medium hover:bg-hover">
                  Manage videos
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="no-scrollbar mt-4 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('relative h-12 shrink-0 text-base font-medium', tab === t ? 'text-ink' : 'text-muted hover:text-ink')}>
            {t}
            {tab === t && <motion.span layoutId="chan-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}
          </button>
        ))}
      </nav>

      {tab === 'Home' && (
        <>
          {trailer && (
            <section className="flex flex-col gap-6 border-b border-line py-6 md:flex-row">
              <div className="w-full shrink-0 overflow-hidden rounded-card md:w-[424px]">
                <video src={trailer.src} controls muted playsInline preload="metadata" className="aspect-video w-full bg-black" style={{ background: `linear-gradient(135deg, ${trailer.thumb.from}, ${trailer.thumb.to})` }} />
              </div>
              <div className="min-w-0">
                <Link href={`/watch?v=${trailer.id}`} className="text-lg font-medium hover:underline">
                  {trailer.title}
                </Link>
                <p className="tabular mt-1 text-xs text-muted">
                  {compact(trailer.views)} views • {timeAgo(trailer.publishedAt)}
                </p>
                <p className="mt-3 line-clamp-5 text-sm whitespace-pre-wrap">{trailer.description}</p>
                <Link href={`/watch?v=${trailer.id}`} className="mt-3 inline-block text-sm font-medium">
                  READ MORE
                </Link>
              </div>
            </section>
          )}
          {shelf('Videos', latest)}
          {shelf('Popular videos', popular)}
          {playlists.map((p) =>
            p.videoIds.length ? (
              <section key={p.id} className="border-b border-line py-6">
                <div className="mb-4 flex items-center gap-4">
                  <h2 className="text-xl font-bold">{p.title}</h2>
                  <Link href={`/watch?v=${p.videoIds[0]}&list=${p.id}`} className="rounded-pill px-3 py-1.5 text-sm font-medium hover:bg-soft">
                    ▶ Play all
                  </Link>
                </div>
                <div className="no-scrollbar flex gap-4 overflow-x-auto">
                  {p.videoIds.map((vid) => {
                    const v = yt.getVideo(vid);
                    return v ? (
                      <div key={vid} className="w-[251px] shrink-0">
                        <VideoCard video={v} showAvatar={false} />
                      </div>
                    ) : null;
                  })}
                </div>
              </section>
            ) : null,
          )}
          {all.length === 0 && <p className="py-10 text-center text-muted">This channel hasn&apos;t posted any videos yet.</p>}
        </>
      )}

      {tab === 'Videos' && (
        <section className="@container py-6">
          <div className="mb-6 flex gap-3">
            {(['latest', 'popular', 'oldest'] as const).map((s) => (
              <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-10 @[560px]:grid-cols-2 @[860px]:grid-cols-3 @[1150px]:grid-cols-4">
            {sorted.map((v) => (
              <VideoCard key={v.id} video={v} showAvatar={false} />
            ))}
          </div>
          {sorted.length === 0 && <p className="text-muted">No videos yet.</p>}
        </section>
      )}

      {tab === 'Shorts' && (
        <section className="grid grid-cols-2 gap-x-1 gap-y-6 py-6 sm:grid-cols-3 lg:grid-cols-5">
          {shorts.map((s) => (
            <Link key={s.id} href={`/shorts?s=${s.id}`}>
              <Thumbnail video={s} vertical />
              <p className="mt-2 line-clamp-2 text-base font-medium">{s.title}</p>
              <p className="tabular text-sm text-muted">{compact(s.views)} views</p>
            </Link>
          ))}
          {shorts.length === 0 && <p className="col-span-full text-muted">No Shorts yet.</p>}
        </section>
      )}

      {tab === 'Playlists' && (
        <section className="grid grid-cols-1 gap-x-4 gap-y-8 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} id={p.id} title={p.title} videoIds={p.videoIds} subtitle={`Updated ${timeAgo(p.createdAt)}`} />
          ))}
          {playlists.length === 0 && <p className="col-span-full text-muted">No playlists yet.</p>}
        </section>
      )}

      {tab === 'Community' && (
        <section className="max-w-[852px] space-y-4 py-6">
          {polls.map((p) => {
            const mine = yt.pollVotes[p.id];
            const votes = p.votes.map((n, i) => n + (mine === i ? 1 : 0));
            const total = votes.reduce((a, b) => a + b, 0);
            return (
              <article key={p.id} className="rounded-card border border-line p-4">
                <header className="mb-2 flex items-center gap-3 text-sm">
                  <GradientAvatar colors={ch.avatar} label={ch.initials} size={40} />
                  <span className="font-medium">{ch.name}</span>
                  <span className="text-muted">{timeAgo(p.postedAt)}</span>
                </header>
                <p className="mb-1 text-sm">{p.question}</p>
                <p className="tabular mb-3 text-xs text-muted">{total.toLocaleString()} votes</p>
                <div className="space-y-2">
                  {p.options.map((o, i) => {
                    const pct = Math.round((votes[i] / total) * 100);
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => yt.vote(p.id, i)}
                        className={cx('relative flex h-11 w-full items-center overflow-hidden rounded-chip border px-4 text-left text-sm', mine === i ? 'border-ink' : 'border-line hover:bg-soft')}
                        aria-pressed={mine === i}
                      >
                        {mine !== undefined && <motion.span initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} className="absolute inset-y-0 left-0 bg-white/15" />}
                        <span className="relative flex-1">{o}</span>
                        {mine !== undefined && <span className="tabular relative font-medium">{pct}%</span>}
                      </button>
                    );
                  })}
                </div>
                <footer className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={16} /> {compact(Math.round(total / 7))}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquareText size={16} /> {compact(Math.round(total / 40))}
                  </span>
                </footer>
              </article>
            );
          })}
          {latest[0] && (
            <article className="rounded-card border border-line p-4">
              <header className="mb-2 flex items-center gap-3 text-sm">
                <GradientAvatar colors={ch.avatar} label={ch.initials} size={40} />
                <span className="font-medium">{ch.name}</span>
                <span className="text-muted">{timeAgo(latest[0].publishedAt)}</span>
              </header>
              <p className="mb-3 text-sm">New video is live! Let us know what you think in the comments 👇</p>
              <Link href={`/watch?v=${latest[0].id}`} className="flex flex-col gap-3 rounded-card bg-soft p-3 sm:flex-row">
                <div className="w-full sm:w-[246px]">
                  <Thumbnail video={latest[0]} />
                </div>
                <p className="text-base font-medium">{latest[0].title}</p>
              </Link>
            </article>
          )}
        </section>
      )}

      <Modal open={about} onClose={() => setAbout(false)} title="About">
        <p className="mb-4 text-sm whitespace-pre-wrap">{ch.bio}</p>
        <ul className="tabular space-y-2 text-sm text-muted">
          <li>@{ch.handle}</li>
          <li>{ch.subscribers.toLocaleString()} subscribers</li>
          <li>{all.length} videos</li>
          <li>{all.reduce((n, v) => n + v.views, 0).toLocaleString()} views</li>
        </ul>
      </Modal>
    </div>
  );
}
