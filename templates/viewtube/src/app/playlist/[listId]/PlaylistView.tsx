'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, ListVideo, Play, Shuffle, X } from 'lucide-react';
import Thumbnail from '@/components/video/Thumbnail';
import { EmptyState, IconButton, Verified, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, timeAgo } from '@/lib/format';

export default function PlaylistView({ listId }: { listId: string }) {
  const yt = useYouTube();
  const list = yt.getList(listId);
  const [dragging, setDragging] = useState(false);
  const source = list?.videoIds;
  const { getVideo } = yt;
  const ids = useMemo(() => (source ?? []).filter((id) => getVideo(id)), [source, getVideo]);
  const shuffleId = useMemo(() => ids[Math.floor(Math.random() * ids.length)], [ids]);

  if (!list)
    return (
      <EmptyState icon={<ListVideo size={96} strokeWidth={1.25} />} title="This playlist doesn't exist" text="It may have been deleted. Create a new one from any video's Save menu.">
        <Link href="/feed/playlists" className="rounded-pill bg-raised px-4 py-2 text-sm font-medium hover:bg-hover">
          Your playlists
        </Link>
      </EmptyState>
    );

  const first = yt.getVideo(ids[0]);
  const tint = first?.thumb.from ?? '#3f3f3f';
  const owner = list.builtIn || !list.ownerId ? 'You' : (yt.getChannel(list.ownerId)?.name ?? 'You');
  const totalViews = ids.reduce((n, id) => n + (yt.getVideo(id)?.views ?? 0), 0);

  const onReorder = (next: string[]) => yt.reorderList(listId, next);

  return (
    <div className="flex flex-col gap-6 px-0 pb-16 lg:flex-row lg:px-6 lg:pt-6">
      <aside
        className="relative shrink-0 overflow-hidden p-6 lg:sticky lg:top-[80px] lg:h-[calc(100vh-104px)] lg:w-[360px] lg:rounded-2xl"
        style={{ background: `linear-gradient(180deg, ${tint}cc 0%, ${tint}55 45%, rgba(15,15,15,.6) 100%)` }}
      >
        <div className="absolute inset-0 backdrop-blur-3xl" />
        <div className="relative">
          {first ? <Thumbnail video={first} /> : <div className="aspect-video rounded-card bg-raised" />}
          <h1 className="mt-6 text-[28px] leading-9 font-bold">{list.title}</h1>
          <p className="mt-3 text-sm font-medium">{owner}</p>
          <p className="tabular mt-1 text-xs text-white/70">
            {list.builtIn ? 'Private' : 'Playlist'} • {ids.length} videos • {compact(totalViews)} views
          </p>
          {list.description && <p className="mt-3 text-sm text-white/80">{list.description}</p>}
          <div className="mt-5 flex gap-2">
            <Link
              href={ids[0] ? `/watch?v=${ids[0]}&list=${listId}` : '#'}
              aria-disabled={!ids.length}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-pill bg-ink text-sm font-medium text-canvas hover:bg-[#d9d9d9] aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <Play size={20} fill="currentColor" /> Play all
            </Link>
            <Link
              href={shuffleId ? `/watch?v=${shuffleId}&list=${listId}` : '#'}
              aria-disabled={!ids.length}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-pill bg-white/20 text-sm font-medium backdrop-blur hover:bg-white/30 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <Shuffle size={20} /> Shuffle
            </Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-2 lg:px-0">
        {ids.length === 0 && <p className="py-10 text-center text-sm text-muted">No videos in this playlist yet. Use “Save” on any video to add one.</p>}
        {list.editable ? (
          <Reorder.Group axis="y" values={ids} onReorder={onReorder} className="space-y-1">
            {ids.map((id, i) => (
              <Reorder.Item key={id} value={id} onDragStart={() => setDragging(true)} onDragEnd={() => setDragging(false)} className="cursor-grab active:cursor-grabbing">
                <Row id={id} index={i} listId={listId} dragging={dragging} onRemove={() => (yt.togglePlaylistVideo(listId, id), toast(`Removed from ${list.title}`))} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-1">
            {ids.map((id, i) => (
              <Row key={id} id={id} index={i} listId={listId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ id, index, listId, onRemove, dragging }: { id: string; index: number; listId: string; onRemove?: () => void; dragging?: boolean }) {
  const yt = useYouTube();
  const v = yt.getVideo(id);
  if (!v) return null;
  const ch = yt.getChannel(v.channelId);
  return (
    <div className="group flex items-center gap-2 rounded-card bg-canvas p-2 hover:bg-soft">
      {onRemove ? <GripVertical size={20} className="shrink-0 text-muted" aria-label="Drag to reorder" /> : <span className="tabular w-6 shrink-0 text-center text-sm text-muted">{index + 1}</span>}
      <Link href={`/watch?v=${id}&list=${listId}`} onClick={(e) => dragging && e.preventDefault()} draggable={false} className="w-[120px] shrink-0 sm:w-[160px]">
        <Thumbnail video={v} rounded="rounded-chip" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/watch?v=${id}&list=${listId}`} draggable={false} className="line-clamp-2 text-base font-medium">
          {v.title}
        </Link>
        <p className="tabular mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
          {ch?.name} {ch?.verified && <Verified className="h-3 w-3" />} • {compact(v.views)} views • {timeAgo(v.publishedAt)}
        </p>
      </div>
      {onRemove && (
        <IconButton label="Remove from playlist" onClick={onRemove} className="opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <X size={20} />
        </IconButton>
      )}
    </div>
  );
}
