'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ListVideo, SearchX, SlidersHorizontal } from 'lucide-react';
import SearchResultCard from '@/components/video/SearchResultCard';
import { Chip, EmptyState, GradientAvatar, Modal, PillButton, Verified, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { SEED_PLAYLISTS } from '@/data/seed-youtube';
import { compact, cx } from '@/lib/format';

type Upload = 'any' | 'hour' | 'today' | 'week' | 'month' | 'year';
type Kind = 'all' | 'video' | 'channel' | 'playlist';
type Dur = 'any' | 'short' | 'medium' | 'long';
type Sort = 'relevance' | 'views' | 'rating' | 'date';

const GROUPS = [
  { key: 'upload', title: 'Upload date', opts: [['hour', 'Last hour'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['year', 'This year']] },
  { key: 'kind', title: 'Type', opts: [['video', 'Video'], ['channel', 'Channel'], ['playlist', 'Playlist']] },
  { key: 'dur', title: 'Duration', opts: [['short', 'Under 4 minutes'], ['medium', '4 - 20 minutes'], ['long', 'Over 20 minutes']] },
  { key: 'sort', title: 'Sort by', opts: [['relevance', 'Relevance'], ['date', 'Upload date'], ['views', 'View count'], ['rating', 'Rating']] },
] as const;

const AGE: Record<Upload, number> = { any: Infinity, hour: 3600e3, today: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 };

function ResultsInner() {
  const sp = useSearchParams();
  const q = (sp.get('search_query') ?? '').trim();
  const yt = useYouTube();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<{ upload: Upload; kind: Kind; dur: Dur; sort: Sort }>({ upload: 'any', kind: 'all', dur: 'any', sort: 'relevance' });

  const terms = q.toLowerCase().replace(/^#/, '').split(/\s+/).filter(Boolean);
  const score = (hay: string) => terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);

  const videos = useMemo(() => {
    const now = Date.now();
    return yt.videos
      .filter((v) => v.visibility === 'Public' && !v.isShort)
      .map((v) => {
        const ch = yt.getChannel(v.channelId);
        const s = terms.length ? score(`${v.title} ${v.description} ${v.category} ${v.hashtags.join(' ')} ${ch?.name} ${ch?.handle} ${v.isLive ? 'live' : ''}`.toLowerCase()) : 1;
        return { v, s };
      })
      .filter(({ v, s }) => s > 0 && now - new Date(v.publishedAt).getTime() <= AGE[f.upload])
      .filter(({ v }) => (f.dur === 'short' ? v.duration < 240 : f.dur === 'medium' ? v.duration >= 240 && v.duration <= 1200 : f.dur === 'long' ? v.duration > 1200 : true))
      .sort((a, b) =>
        f.sort === 'views' ? b.v.views - a.v.views : f.sort === 'rating' ? b.v.likes / (b.v.views || 1) - a.v.likes / (a.v.views || 1) : f.sort === 'date' ? b.v.publishedAt.localeCompare(a.v.publishedAt) : b.s - a.s || b.v.views - a.v.views,
      )
      .map(({ v }) => v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yt.videos, q, f]);

  const channels = useMemo(() => yt.channels.filter((c) => terms.length && score(`${c.name} ${c.handle} ${c.bio}`.toLowerCase()) > 0), [yt.channels, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const playlists = useMemo(
    () => [...SEED_PLAYLISTS, ...yt.playlists].filter((p) => terms.length && score(`${p.title} ${p.description ?? ''}`.toLowerCase()) > 0 && p.videoIds.length),
    [yt.playlists, q], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const showV = f.kind === 'all' || f.kind === 'video';
  const showC = f.kind === 'all' || f.kind === 'channel';
  const showP = f.kind === 'all' || f.kind === 'playlist';
  const empty = (!showV || !videos.length) && (!showC || !channels.length) && (!showP || !playlists.length);
  const set = (key: string, val: string) => setF((p) => ({ ...p, [key]: (p as Record<string, string>)[key] === val ? (key === 'sort' ? 'relevance' : key === 'kind' ? 'all' : 'any') : val }));

  return (
    <div className="mx-auto max-w-[1096px] px-4 pt-4 pb-16 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="no-scrollbar flex flex-1 gap-3 overflow-x-auto">
          {(['all', 'video', 'channel', 'playlist'] as Kind[]).map((k) => (
            <Chip key={k} active={f.kind === k} onClick={() => setF((p) => ({ ...p, kind: k }))}>
              {k === 'all' ? 'All' : `${k[0].toUpperCase()}${k.slice(1)}s`}
            </Chip>
          ))}
        </div>
        <PillButton variant="soft" className="bg-transparent hover:bg-soft" onClick={() => setOpen(true)}>
          <SlidersHorizontal size={20} /> Filters
        </PillButton>
      </div>

      {empty && (
        <EmptyState icon={<SearchX size={96} strokeWidth={1.25} />} title="No results found" text="Try different keywords or remove search filters." />
      )}

      <div className="space-y-4">
        {showC &&
          channels.map((c) => {
            const subscribed = yt.subscribed.includes(c.id);
            return (
              <div key={c.id} className="flex flex-col items-center gap-4 overflow-hidden rounded-card border-b border-line pb-4 sm:flex-row">
                <Link href={`/channel/${c.id}`} className="grid h-[136px] w-full shrink-0 place-items-center rounded-card sm:w-[246px] lg:w-[360px]" style={{ background: `linear-gradient(135deg, ${c.banner[0]}, ${c.banner[1]})` }}>
                  <GradientAvatar colors={c.avatar} label={c.initials} size={120} className="ring-4 ring-canvas" />
                </Link>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <Link href={`/channel/${c.id}`} className="flex items-center justify-center gap-1 text-lg sm:justify-start">
                    {c.name} {c.verified && <Verified />}
                  </Link>
                  <p className="tabular text-xs text-muted">
                    @{c.handle} • {compact(c.subscribers)} subscribers
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted">{c.bio}</p>
                </div>
                <PillButton variant={subscribed ? 'soft' : 'white'} onClick={() => (yt.toggleSubscribe(c.id), toast(subscribed ? 'Subscription removed' : 'Subscription added'))}>
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </PillButton>
              </div>
            );
          })}

        {showP &&
          playlists.map((p) => {
            const first = yt.getVideo(p.videoIds[0]);
            return (
              <Link key={p.id} href={`/playlist/${p.id}`} className="flex flex-col gap-4 sm:flex-row">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-card sm:w-[246px] lg:w-[360px]" style={{ background: first ? `linear-gradient(135deg, ${first.thumb.from}, ${first.thumb.to})` : '#272727' }}>
                  <span className="absolute right-1 bottom-1 flex items-center gap-1 rounded bg-black/80 px-1 text-xs font-medium">
                    <ListVideo size={14} /> {p.videoIds.length} videos
                  </span>
                </div>
                <div>
                  <h3 className="text-lg">{p.title}</h3>
                  <p className="text-xs text-muted">{yt.getChannel(p.ownerId)?.name ?? 'You'} • Playlist</p>
                  <p className="mt-3 text-xs font-medium text-muted">View full playlist</p>
                </div>
              </Link>
            );
          })}

        {showV && videos.map((v) => <SearchResultCard key={v.id} video={v} />)}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Search filters" width="max-w-4xl">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {GROUPS.map((g) => (
            <div key={g.key}>
              <h3 className="border-b border-line pb-3 text-xs font-bold tracking-wide uppercase">{g.title}</h3>
              <ul className="pt-2">
                {g.opts.map(([val, label]) => {
                  const active = (f as Record<string, string>)[g.key] === val;
                  return (
                    <li key={val}>
                      <button type="button" onClick={() => set(g.key, val)} className={cx('py-2.5 text-left text-sm', active ? 'font-bold text-ink' : 'text-muted hover:text-ink')}>
                        {label}
                        {active && ' ✕'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
