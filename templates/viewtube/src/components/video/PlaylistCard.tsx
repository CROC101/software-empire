'use client';

import Link from 'next/link';
import { ListVideo, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { useYouTube } from '@/context/YouTubeContext';

/** Stacked-look playlist card linking to /playlist/[id]. */
export default function PlaylistCard({ id, title, videoIds, subtitle, action }: { id: string; title: string; videoIds: string[]; subtitle?: string; action?: ReactNode }) {
  const { getVideo } = useYouTube();
  const first = getVideo(videoIds[0]);
  const bg = first ? `linear-gradient(135deg, ${first.thumb.from}, ${first.thumb.to})` : 'linear-gradient(135deg, #3f3f3f, #212121)';
  return (
    <article className="group min-w-0">
      <Link href={`/playlist/${id}`} className="relative block pt-2">
        <span className="absolute top-0 right-4 left-4 h-2 rounded-t-card opacity-50" style={{ background: bg }} />
        <span className="absolute top-1 right-2 left-2 h-2 rounded-t-card opacity-75" style={{ background: bg }} />
        <span className="relative grid aspect-video place-items-center overflow-hidden rounded-card border-t border-canvas" style={{ background: bg }}>
          <span className="text-5xl font-black text-white/90 drop-shadow">{first?.thumb.glyph ?? '≡'}</span>
          <span className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-2">
              <Play size={18} fill="currentColor" /> Play all
            </span>
          </span>
          <span className="tabular absolute right-1 bottom-1 flex items-center gap-1 rounded bg-black/80 px-1 text-xs font-medium">
            <ListVideo size={14} /> {videoIds.length} videos
          </span>
        </span>
      </Link>
      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/playlist/${id}`}>
            <h3 className="line-clamp-2 text-sm font-medium">{title}</h3>
          </Link>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          <Link href={`/playlist/${id}`} className="text-sm text-muted hover:text-ink">
            View full playlist
          </Link>
        </div>
        {action}
      </div>
    </article>
  );
}
