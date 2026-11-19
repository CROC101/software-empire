'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { History, LayoutGrid, List, ListVideo, Pause, Play, Plus, Search, SquarePlay, Trash2, X } from 'lucide-react';
import VideoCard from '@/components/video/VideoCard';
import SearchResultCard from '@/components/video/SearchResultCard';
import PlaylistCard from '@/components/video/PlaylistCard';
import Thumbnail from '@/components/video/Thumbnail';
import { EmptyState, GradientAvatar, IconButton, Modal, PillButton, toast } from '@/components/ui';
import { MY_CHANNEL_ID, useYouTube } from '@/context/YouTubeContext';
import { cx, fullDate } from '@/lib/format';

export type FeedType = 'subscriptions' | 'history' | 'playlists' | 'you';

function Subscriptions() {
  const yt = useYouTube();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const list = useMemo(
    () => yt.videos.filter((v) => yt.subscribed.includes(v.channelId) && !v.isShort && v.visibility === 'Public').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [yt.videos, yt.subscribed],
  );
  if (!yt.subscribed.length)
    return (
      <EmptyState icon={<SquarePlay size={96} strokeWidth={1.25} />} title="Don’t miss new videos" text="Subscribe to channels to see their latest videos here.">
        <Link href="/" className="rounded-pill bg-raised px-4 py-2 text-sm font-medium hover:bg-hover">
          Explore videos
        </Link>
      </EmptyState>
    );
  return (
    <div className="@container px-4 pt-6 pb-16 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-base font-bold">Latest</h1>
        <div className="flex items-center gap-1">
          <Link href="/feed/you" className="mr-2 rounded-pill px-3 py-2 text-sm font-medium text-link hover:bg-[#263850]">
            Manage
          </Link>
          <IconButton label="Grid view" active={view === 'grid'} onClick={() => setView('grid')}>
            <LayoutGrid size={22} />
          </IconButton>
          <IconButton label="List view" active={view === 'list'} onClick={() => setView('list')}>
            <List size={22} />
          </IconButton>
        </div>
      </div>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 @[600px]:grid-cols-2 @[900px]:grid-cols-3 @[1240px]:grid-cols-4">
          {list.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-[1096px] space-y-6">
          {list.map((v) => (
            <SearchResultCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function SideAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-14 w-full items-center gap-3 rounded-pill px-3 text-sm font-medium hover:bg-soft">
      {icon} {label}
    </button>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return fullDate(iso);
}

function HistoryFeed() {
  const yt = useYouTube();
  const [filter, setFilter] = useState('');
  const [confirm, setConfirm] = useState<null | 'watch' | 'search'>(null);

  const groups = useMemo(() => {
    const out: { label: string; items: typeof yt.history }[] = [];
    for (const h of yt.history) {
      const v = yt.getVideo(h.videoId);
      if (!v || (filter && !v.title.toLowerCase().includes(filter.toLowerCase()))) continue;
      const label = dayLabel(h.watchedAt);
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(h);
      else out.push({ label, items: [h] });
    }
    return out;
  }, [yt, filter]);

  return (
    <div className="mx-auto flex max-w-[1284px] gap-8 px-4 pt-6 pb-16 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-4xl font-bold">Watch history</h1>
        {yt.history.length === 0 ? (
          <div className="flex flex-col items-center pt-10 text-center">
            <History size={96} strokeWidth={1.5} className="mb-6" />
            <h2 className="mb-4 text-2xl font-medium">Keep track of what you watch</h2>
            <p className="mb-6 text-sm">
              {yt.historyPaused ? 'Watch history is paused. ' : 'Videos you watch will show up here. '}
              <Link href="/" className="text-link">
                Find something to watch
              </Link>
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="mb-8">
              <h2 className="mb-4 text-xl font-bold">{g.label}</h2>
              <div className="space-y-4">
                {g.items.map((h) => {
                  const v = yt.getVideo(h.videoId);
                  return v ? (
                    <SearchResultCard
                      key={h.videoId}
                      video={v}
                      extra={
                        <IconButton label="Remove from watch history" onClick={() => yt.removeHistory(v.id)}>
                          <X size={22} />
                        </IconButton>
                      }
                    />
                  ) : null;
                })}
              </div>
            </section>
          ))
        )}
        {yt.history.length > 0 && groups.length === 0 && <p className="text-muted">No videos in your history match “{filter}”.</p>}
      </div>

      <aside className="hidden w-[300px] shrink-0 pt-4 lg:block">
        <label className="mb-6 flex items-center gap-3 border-b border-line pb-2 focus-within:border-ink">
          <Search size={22} />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search watch history" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <SideAction icon={<Trash2 size={24} />} label="Clear all watch history" onClick={() => setConfirm('watch')} />
        <SideAction
          icon={yt.historyPaused ? <Play size={24} /> : <Pause size={24} />}
          label={yt.historyPaused ? 'Turn on watch history' : 'Pause watch history'}
          onClick={() => (yt.setHistoryPaused(!yt.historyPaused), toast(yt.historyPaused ? 'Watch history is on' : 'Watch history paused'))}
        />
        <SideAction icon={<Trash2 size={24} />} label="Clear all search history" onClick={() => setConfirm('search')} />
        <SideAction
          icon={yt.searchPaused ? <Play size={24} /> : <Pause size={24} />}
          label={yt.searchPaused ? 'Turn on search history' : 'Pause search history'}
          onClick={() => (yt.setSearchPaused(!yt.searchPaused), toast(yt.searchPaused ? 'Search history is on' : 'Search history paused'))}
        />
        {yt.searchHistory.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-medium">Recent searches</h3>
            <ul className="space-y-1">
              {yt.searchHistory.map((s) => (
                <li key={s} className="flex items-center justify-between text-sm">
                  <Link href={`/results?search_query=${encodeURIComponent(s)}`} className="truncate text-muted hover:text-ink">
                    {s}
                  </Link>
                  <button type="button" aria-label={`Remove ${s}`} onClick={() => yt.removeSearch(s)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Compact controls for small screens */}
      <div className="fixed right-4 bottom-4 z-20 flex gap-2 lg:hidden">
        <PillButton onClick={() => setConfirm('watch')}>
          <Trash2 size={18} /> Clear
        </PillButton>
        <PillButton onClick={() => yt.setHistoryPaused(!yt.historyPaused)}>{yt.historyPaused ? <Play size={18} /> : <Pause size={18} />} {yt.historyPaused ? 'Resume' : 'Pause'}</PillButton>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'search' ? 'Clear search history?' : 'Clear watch history?'}>
        <p className="mb-6 text-sm text-muted">This can’t be undone. Recommendations will be reset for this browser.</p>
        <div className="flex justify-end gap-2">
          <PillButton variant="soft" className="bg-transparent" onClick={() => setConfirm(null)}>
            Cancel
          </PillButton>
          <PillButton
            variant="blue"
            onClick={() => {
              if (confirm === 'search') yt.clearSearchHistory();
              else yt.clearHistory();
              toast(confirm === 'search' ? 'Search history cleared' : 'Watch history cleared');
              setConfirm(null);
            }}
          >
            {confirm === 'search' ? 'Clear search history' : 'Clear watch history'}
          </PillButton>
        </div>
      </Modal>
    </div>
  );
}

function NewPlaylistButton() {
  const yt = useYouTube();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <>
      <PillButton onClick={() => setOpen(true)}>
        <Plus size={20} /> New playlist
      </PillButton>
      <Modal open={open} onClose={() => setOpen(false)} title="New playlist">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = yt.createPlaylist(name);
            toast(id ? 'Playlist created' : 'Playlist limit reached');
            setName('');
            setOpen(false);
          }}
        >
          <input autoFocus value={name} maxLength={150} onChange={(e) => setName(e.target.value)} placeholder="Title" aria-label="Playlist title" className="mb-6 w-full rounded-chip border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-link" />
          <div className="flex justify-end">
            <PillButton type="submit" variant="blue" disabled={!name.trim()}>
              Create
            </PillButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Playlists() {
  const yt = useYouTube();
  return (
    <div className="px-4 pt-6 pb-16 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Playlists</h1>
        <NewPlaylistButton />
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <PlaylistCard id="WL" title="Watch later" videoIds={yt.watchLater} subtitle="Private" />
        <PlaylistCard id="LL" title="Liked videos" videoIds={yt.liked} subtitle="Private" />
        {yt.playlists.map((p) => (
          <PlaylistCard
            key={p.id}
            id={p.id}
            title={p.title}
            videoIds={p.videoIds}
            subtitle="Private • Playlist"
            action={
              <IconButton label="Delete playlist" onClick={() => (yt.deletePlaylist(p.id), toast(`Deleted ${p.title}`))}>
                <Trash2 size={18} />
              </IconButton>
            }
          />
        ))}
      </div>
    </div>
  );
}

function Shelf({ title, href, children, empty }: { title: string; href: string; children: ReactNode; empty: boolean }) {
  return (
    <section className="border-b border-line py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={href} className="rounded-pill border border-line px-3 py-1.5 text-sm font-medium hover:bg-soft">
          View all
        </Link>
      </div>
      {empty ? <p className="text-sm text-muted">Nothing here yet.</p> : <div className="no-scrollbar flex gap-4 overflow-x-auto">{children}</div>}
    </section>
  );
}

function You() {
  const yt = useYouTube();
  const me = yt.getChannel(MY_CHANNEL_ID);
  const mini = (id: string) => {
    const v = yt.getVideo(id);
    return v ? (
      <Link key={id} href={`/watch?v=${id}`} className="w-[210px] shrink-0">
        <Thumbnail video={v} />
        <p className="mt-2 line-clamp-2 text-sm font-medium">{v.title}</p>
        <p className="text-xs text-muted">{yt.getChannel(v.channelId)?.name}</p>
      </Link>
    ) : null;
  };
  return (
    <div className="px-4 pb-16 sm:px-6">
      <header className="flex items-center gap-4 pt-6 pb-2">
        <GradientAvatar colors={['#3ea6ff', '#7f5cff']} label="Y" size={120} className="hidden sm:grid" />
        <GradientAvatar colors={['#3ea6ff', '#7f5cff']} label="Y" size={72} className="sm:hidden" />
        <div>
          <h1 className="text-4xl font-bold">You</h1>
          <p className="mt-1 text-sm text-muted">
            @{me?.handle} •{' '}
            <Link href={`/channel/${MY_CHANNEL_ID}`} className="text-ink hover:underline">
              View channel
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/studio" className="rounded-pill bg-raised px-3 py-1.5 text-xs font-medium hover:bg-hover">
              Creator Studio
            </Link>
            <Link href="/feed/subscriptions" className="rounded-pill bg-raised px-3 py-1.5 text-xs font-medium hover:bg-hover">
              Subscriptions
            </Link>
          </div>
        </div>
      </header>
      <Shelf title="History" href="/feed/history" empty={!yt.history.length}>
        {yt.history.slice(0, 12).map((h) => mini(h.videoId))}
      </Shelf>
      <Shelf title="Playlists" href="/feed/playlists" empty={false}>
        <div className="w-[210px] shrink-0">
          <PlaylistCard id="WL" title="Watch later" videoIds={yt.watchLater} />
        </div>
        <div className="w-[210px] shrink-0">
          <PlaylistCard id="LL" title="Liked videos" videoIds={yt.liked} />
        </div>
        {yt.playlists.map((p) => (
          <div key={p.id} className="w-[210px] shrink-0">
            <PlaylistCard id={p.id} title={p.title} videoIds={p.videoIds} />
          </div>
        ))}
      </Shelf>
      <Shelf title="Watch later" href="/playlist/WL" empty={!yt.watchLater.length}>
        {yt.watchLater.map(mini)}
      </Shelf>
      <Shelf title="Liked videos" href="/playlist/LL" empty={!yt.liked.length}>
        {yt.liked.map(mini)}
      </Shelf>
      <div className={cx('pt-6')}>
        <Link href="/feed/playlists" className="flex items-center gap-3 text-sm text-muted hover:text-ink">
          <ListVideo size={20} /> All playlists
        </Link>
      </div>
    </div>
  );
}

export default function FeedView({ type }: { type: FeedType }) {
  if (type === 'subscriptions') return <Subscriptions />;
  if (type === 'history') return <HistoryFeed />;
  if (type === 'playlists') return <Playlists />;
  return <You />;
}
