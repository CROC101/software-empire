'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Play, ShoppingBag } from 'lucide-react';
import { Art, Avatar } from '@/components/common/Visuals';
import { useLookup } from '@/context/TikTokContext';
import { fmtCount } from '@/lib/format';
import type { Video } from '@/types/tiktok';

/** 9:16 grid tile that previews the clip on hover and opens the theater page. */
export default function VideoThumb({ video, showAuthor = true }: { video: Video; showAuthor?: boolean }) {
  const { creator } = useLookup();
  const ref = useRef<HTMLVideoElement>(null);
  const c = creator(video.handle);
  return (
    <div className="min-w-0">
      <Link
        href={`/@${video.handle}/video/${video.id}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-md bg-skeleton"
        onMouseEnter={() => ref.current?.play().catch(() => {})}
        onMouseLeave={() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0; } }}
      >
        <Art hue={video.hue} seed={Number(video.id.replace(/\D/g, '')) || 1} className="absolute inset-0 h-full w-full" />
        <video ref={ref} src={video.src} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity hover:opacity-100" />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-14 font-semibold text-white drop-shadow"><Play size={14} className="fill-white" />{fmtCount(video.views)}</span>
        {video.productIds.length > 0 && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-deal px-1.5 py-0.5 text-11 font-bold text-white"><ShoppingBag size={11} />Shop</span>}
      </Link>
      <p className="mt-2 line-clamp-1 text-14 text-ink">{video.caption}</p>
      {showAuthor && (
        <Link href={`/@${c.handle}`} className="mt-1 flex items-center gap-1.5 text-13 text-muted hover:text-ink">
          <Avatar hue={c.hue} name={c.name} size={20} /><span className="truncate">{c.handle}</span>
        </Link>
      )}
    </div>
  );
}
