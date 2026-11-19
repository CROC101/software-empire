'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Video } from '@/types/youtube';
import { ChannelAvatar, Verified } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, timeAgo } from '@/lib/format';
import Thumbnail from './Thumbnail';
import VideoMenu from './VideoMenu';

/** Wide horizontal card used by search results, history and list views. */
export default function SearchResultCard({ video, extra, href }: { video: Video; extra?: ReactNode; href?: string }) {
  const { getChannel } = useYouTube();
  const ch = getChannel(video.channelId);
  const link = href ?? `/watch?v=${video.id}`;
  return (
    <article className="group flex flex-col gap-3 sm:flex-row sm:gap-4">
      <Link href={link} className="w-full shrink-0 sm:w-[246px] lg:w-[360px]">
        <Thumbnail video={video} preview />
      </Link>
      <div className="flex min-w-0 flex-1 gap-2">
        <div className="min-w-0 flex-1">
          <Link href={link}>
            <h3 className="line-clamp-2 text-lg leading-[26px] font-normal tracking-[-0.01em]">{video.title}</h3>
          </Link>
          <p className="tabular text-xs text-muted">
            {compact(video.views)} views • {timeAgo(video.publishedAt)}
          </p>
          {ch && (
            <div className="my-3 flex items-center gap-2 text-xs text-muted">
              <ChannelAvatar channel={ch} size={24} />
              <Link href={`/channel/${ch.id}`} className="hover:text-ink">
                {ch.name}
              </Link>
              {ch.verified && <Verified className="h-3 w-3" />}
            </div>
          )}
          <p className="line-clamp-2 text-xs text-muted">{video.description}</p>
          {video.chapters.length > 1 && (
            <span className="mt-2 inline-block rounded bg-soft px-1.5 py-0.5 text-xs text-muted">{video.chapters.length} chapters</span>
          )}
          {video.isLive && <span className="mt-2 ml-1 inline-block rounded bg-brand px-1 text-xs font-medium text-white">LIVE</span>}
        </div>
        {extra}
        <VideoMenu videoId={video.id} />
      </div>
    </article>
  );
}
