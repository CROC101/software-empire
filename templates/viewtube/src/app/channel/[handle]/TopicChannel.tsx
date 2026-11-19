'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ListMusic, MoreVertical } from 'lucide-react';
import Thumbnail from '@/components/video/Thumbnail';
import { GradientAvatar, IconButton, PillButton, Verified, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, cx, timeAgo } from '@/lib/format';
import type { Channel } from '@/types/youtube';

// Invented shelf + playlist names (no real chart/playlist brands).
const SHELVES: [string, string[]][] = [
  ["Today's Biggest Hits", ['The Hot Rotation', 'Pop Spotlight', 'Neon Kings', 'Rap Right Now', 'Night Drive', 'Chart Climbers', 'Fresh Faces', 'Big Choruses']],
  ['New & Trending Songs', ['Just Dropped', 'Pop Before It Peaks', 'New Rock', 'Rising Hip-Hop', 'Indie Radar', 'Weekend Anthems', 'Dance Floor', 'Viral Hooks']],
  ['Top Charts', ['Top 100 Music Videos', 'Top 100 Songs', 'Trending 20', 'Weekly Top Songs on Shorts', 'Top Albums', 'Top Artists', 'Daily Top 50', 'Global Top 100']],
  ['Timeless Classics', ['All-Time Love Songs', 'Legends Only', 'All-Time Rock Hits', 'Alternative Love Hits', 'Golden Oldies', 'Ballads Forever', 'Soul Classics', 'Acoustic Gold']],
  ['Feel-Good Mood', ['Happy Happy', 'Happy Pop Hits', 'Feel-Good Hip-Hop and R&B', 'Feel-Good Classic Rock', 'Sunny Day', 'Smile Mix', 'Good Vibes Only', 'Road Trip']],
  ['Throwback Hits', ['Timeless Classics', 'Laid-Back Hip Hop', "The Hits: '90s", 'Classic Rock Summer', "2000s Party", "'80s Synth", 'Throwback Jams', 'Retro Radio']],
  ['Ready to Work Out', ['Energy Boost', 'Throwback Workout', 'Pump-Up Pop', 'Hit It', 'Cardio Beats', 'Power Lift', 'Run Club', 'Cool Down']],
];

function Shelf({ title, children, count }: { title: string; children: (n: number) => React.ReactNode; count: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="pt-6">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {/* one scrolling row on small screens, 4-up grid on desktop */}
      <div className="no-scrollbar grid auto-cols-[44%] grid-flow-col gap-x-4 gap-y-6 overflow-x-auto sm:auto-cols-[30%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">{children(open ? count : 4)}</div>
      <div className="relative mt-6 mb-2 flex justify-center">
        <hr className="absolute inset-x-0 top-1/2 border-line" />
        <button type="button" onClick={() => setOpen((o) => !o)} className="relative flex h-9 w-[30%] min-w-[160px] items-center justify-center gap-2 rounded-pill border border-line bg-canvas text-sm font-medium hover:bg-soft">
          {open ? 'Show less' : 'Show more'} {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
    </section>
  );
}

export default function TopicChannel({ ch }: { ch: Channel }) {
  const yt = useYouTube();
  const subscribed = yt.subscribed.includes(ch.id);
  const pool = yt.videos.filter((v) => !v.isShort);
  const music = yt.videos.filter((v) => v.category === 'Lo-Fi Music' && !v.isShort);
  const [tab, setTab] = useState<'Home' | 'Posts'>('Home');

  return (
    <div className="pb-16">
      <div className="relative h-[260px] overflow-hidden bg-black sm:h-[360px] lg:h-[460px]">
        {music[0] && <video src={music[0].src} autoPlay muted loop playsInline preload="metadata" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 70% 40%, ${ch.banner[1]}, transparent 60%)` }} />
        <div className="absolute bottom-6 left-6 flex gap-2">
          {music.slice(0, 5).map((v) => (
            <Link
              key={v.id}
              href={`/watch?v=${v.id}`}
              aria-label={v.title}
              className="grid aspect-video w-[64px] place-items-center rounded text-sm font-bold opacity-80 hover:opacity-100 sm:w-[72px]"
              style={{ background: `linear-gradient(135deg, ${v.thumb.from}, ${v.thumb.to})` }}
            >
              {v.thumb.glyph}
            </Link>
          ))}
        </div>
      </div>

      <header className="flex items-center gap-4 bg-elevated px-6 py-4">
        <GradientAvatar colors={ch.avatar} label={ch.initials} size={80} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-[40px] leading-tight font-medium sm:text-5xl lg:text-xl">
            {ch.name} {ch.verified && <Verified className="h-4 w-4" />}
          </h1>
          <p className="tabular text-xs text-muted">{compact(ch.subscribers + (subscribed ? 1 : 0))} subscribers</p>
        </div>
        <PillButton variant={subscribed ? 'soft' : 'white'} onClick={() => (yt.toggleSubscribe(ch.id), toast(subscribed ? 'Subscription removed' : 'Subscription added'))}>
          {subscribed ? 'Subscribed' : 'Subscribe'}
        </PillButton>
      </header>

      <nav role="tablist" className="flex gap-6 border-b border-line bg-elevated px-6">
        {(['Home', 'Posts'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('h-12 border-b-2 text-sm font-medium', tab === t ? 'border-ink' : 'border-transparent text-muted hover:text-ink')}>
            {t}
          </button>
        ))}
      </nav>

      <div className="px-6">
        {tab === 'Posts' && <p className="py-16 text-center text-sm text-muted">This channel hasn&apos;t posted yet.</p>}
        {tab === 'Home' &&
          SHELVES.map(([title, names], s) => (
            <div key={title}>
              <Shelf title={title} count={names.length}>
                {(n) =>
                  names.slice(0, n).map((name, i) => {
                    const v = pool[(s * 3 + i) % pool.length];
                    const listId = (s + i) % 2 ? 'PLtrending' : 'PLhits';
                    return (
                      <article key={name}>
                        <Link href={`/playlist/${listId}`} className="relative block pt-1.5">
                          <span className="absolute inset-x-3 top-0 h-1.5 rounded-t-md opacity-50" style={{ background: v.thumb.to }} />
                          <span className="absolute inset-x-1.5 top-[3px] h-1.5 rounded-t-md opacity-75" style={{ background: v.thumb.from }} />
                          <Thumbnail video={v} rounded="rounded-card" />
                          <span className="tabular absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium">
                            <ListMusic size={12} /> {40 + ((s * 17 + i * 13) % 90)} songs
                          </span>
                        </Link>
                        <div className="mt-3 flex gap-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-[15px] leading-5 font-medium">
                              <Link href={`/playlist/${listId}`}>{name}</Link>
                            </h3>
                            <p className="mt-1 text-xs text-muted">ViewTube Music · Playlist</p>
                            <p className="text-xs text-muted">Updated today</p>
                            <Link href={`/playlist/${listId}`} className="text-xs font-medium text-muted hover:text-ink">
                              View full playlist
                            </Link>
                          </div>
                          <IconButton label="More actions" onClick={() => toast(`Saved “${name}” to your library`)} className="h-8 w-8 shrink-0">
                            <MoreVertical size={18} />
                          </IconButton>
                        </div>
                      </article>
                    );
                  })
                }
              </Shelf>
              {s === 2 && (
                <Shelf title="New Music Videos" count={music.length}>
                  {(n) =>
                    music.slice(0, Math.min(n, 3)).map((v) => (
                      <article key={v.id}>
                        <Link href={`/watch?v=${v.id}`}>
                          <Thumbnail video={v} rounded="rounded-card" />
                        </Link>
                        <h3 className="mt-3 line-clamp-2 text-[15px] leading-5 font-medium">
                          <Link href={`/watch?v=${v.id}`}>{v.title}</Link>
                        </h3>
                        <p className="tabular mt-1 text-xs text-muted">
                          {yt.getChannel(v.channelId)?.name} · {compact(v.views)} · {timeAgo(v.publishedAt)}
                        </p>
                      </article>
                    ))
                  }
                </Shelf>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
