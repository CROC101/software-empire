'use client';

import Link from 'next/link';
import type { Video } from '@/types/youtube';
import { Verified } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, cx, timeAgo } from '@/lib/format';
import Thumbnail from './Thumbnail';
import VideoMenu from './VideoMenu';

export default function RelatedVideoCard({ video, href, active = false, index }: { video: Video; href?: string; active?: boolean; index?: number }) {
  const { getChannel } = useYouTube();
  const ch = getChannel(video.channelId);
  return (
    <div className={cx('group relative flex gap-2 rounded-chip', active && 'bg-soft')}>
      {index !== undefined && <span className="tabular w-5 shrink-0 self-center text-center text-xs text-muted">{active ? '▶' : index + 1}</span>}
      <Link href={href ?? `/watch?v=${video.id}`} className="w-[168px] shrink-0">
        <Thumbnail video={video} rounded="rounded-chip" />
      </Link>
      <div className="min-w-0 flex-1 pr-6">
        <Link href={href ?? `/watch?v=${video.id}`}>
          <h4 className="line-clamp-2 text-sm leading-5 font-medium tracking-[-0.01em]">{video.title}</h4>
        </Link>
        {ch && (
          <Link href={`/channel/${ch.id}`} className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-ink">
            <span className="truncate">{ch.name}</span>
            {ch.verified && <Verified className="h-3 w-3" />}
          </Link>
        )}
        <p className="tabular text-xs text-muted">
          {compact(video.views)} views • {timeAgo(video.publishedAt)}
        </p>
      </div>
      <VideoMenu videoId={video.id} className="absolute top-0 -right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100" />
    </div>
  );
}
