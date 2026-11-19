'use client';

import Link from 'next/link';
import type { Video } from '@/types/youtube';
import { ChannelAvatar, Verified } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, timeAgo } from '@/lib/format';
import Thumbnail from './Thumbnail';
import VideoMenu from './VideoMenu';

export default function VideoCard({ video, showAvatar = true }: { video: Video; showAvatar?: boolean }) {
  const { getChannel } = useYouTube();
  const ch = getChannel(video.channelId);
  return (
    <article className="group min-w-0">
      <Link href={`/watch?v=${video.id}`} aria-label={video.title} className="block">
        <Thumbnail video={video} preview />
      </Link>
      <div className="mt-3 flex gap-3">
        {showAvatar && ch && <ChannelAvatar channel={ch} />}
        <div className="min-w-0 flex-1">
          <Link href={`/watch?v=${video.id}`}>
            <h3 className="line-clamp-2 text-base leading-[22px] font-medium tracking-[-0.01em]">{video.title}</h3>
          </Link>
          {ch && (
            <Link href={`/channel/${ch.id}`} className="mt-1 flex items-center gap-1 text-sm text-muted hover:text-ink">
              <span className="truncate">{ch.name}</span>
              {ch.verified && <Verified />}
            </Link>
          )}
          <p className="tabular text-sm text-muted">
            {video.isLive ? `${compact(video.views)} watching` : `${compact(video.views)} views • ${timeAgo(video.publishedAt)}`}
          </p>
          {video.isLive && <span className="mt-1 inline-block rounded bg-brand px-1 text-xs font-medium text-white">LIVE</span>}
        </div>
        <VideoMenu videoId={video.id} className="-mr-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" />
      </div>
    </article>
  );
}
