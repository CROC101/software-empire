"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Clock, ListPlus, ThumbsUp, X } from "lucide-react";
import { CoverArt } from "./CoverArt";
import { useHub } from "@/context/MediaHubContext";
import { getChannel } from "@/data/seed-media";
import { approval, formatCount, formatDuration, timeAgo } from "@/lib/format";
import type { VideoItem } from "@/types/media";

const FRAMES = 6;

export function VideoCard({
  video,
  onDismiss,
  onAddToPlaylist,
}: {
  video: VideoItem;
  onDismiss?: () => void;
  onAddToPlaylist?: () => void;
}) {
  const { watchLater, toggleWatchLater, toast } = useHub();
  const [scrub, setScrub] = useState<number | null>(null);
  const frame = scrub === null ? 0 : Math.min(FRAMES - 1, Math.floor(scrub * FRAMES));
  const chapter = scrub === null ? null : [...video.chapters].reverse().find((c) => c.time <= scrub * video.duration) ?? video.chapters[0];
  const saved = watchLater.includes(video.id);
  const creator = getChannel(video.creator);
  const pct = approval(video.likes, video.dislikes);

  return (
    <div className="group relative min-w-0">
      <Link
        href={`/watch/${video.id}`}
        className="relative block aspect-video overflow-hidden rounded-thumb bg-obsidian"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setScrub(Math.max(0, Math.min(0.999, (e.clientX - r.left) / r.width)));
        }}
        onMouseLeave={() => setScrub(null)}
        aria-label={video.title}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={frame}
            className="absolute inset-0"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <CoverArt seed={video.id} palette={video.palette} frame={frame} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute left-[6px] top-[6px] rounded-thumb bg-brand px-[5px] py-[1px] text-2xs font-bold text-black">
          {video.quality === "4K" ? "4K" : "HD"}
          {video.fps === 60 && <span className="ml-1 font-normal">60</span>}
        </span>
        <span className="absolute bottom-[7px] right-[6px] max-w-[123px] rounded-thumb bg-surface-2/80 px-[5px] py-[2px] text-xs font-bold text-white">
          {formatDuration(video.duration)}
        </span>
        {chapter && (
          <span className="absolute bottom-[7px] left-[6px] max-w-[60%] truncate rounded-thumb bg-black/70 px-[5px] py-[2px] text-2xs text-white">
            {formatDuration((scrub ?? 0) * video.duration)} · {chapter.title}
          </span>
        )}
        {scrub !== null && (
          <span className="absolute bottom-0 left-0 h-[3px] bg-brand" style={{ width: `${scrub * 100}%` }} aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWatchLater(video.id);
            toast(saved ? "Removed from Watch Later" : "Added to Watch Later");
          }}
          aria-label={saved ? "Remove from Watch Later" : "Watch Later"}
          title="Watch Later"
          className={`absolute right-[6px] top-[6px] flex h-[28px] w-[28px] items-center justify-center rounded-thumb bg-black/70 transition-opacity hover:text-brand ${
            saved ? "text-brand opacity-100" : "text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        >
          <Clock className="h-4 w-4" />
        </button>
      </Link>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Not interested"
          className="absolute right-[38px] top-[6px] flex h-[28px] w-[28px] items-center justify-center rounded-thumb bg-black/70 text-white opacity-0 transition-opacity hover:text-brand group-hover:opacity-100 focus:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="mt-[5px] flex items-center gap-1">
        <Link href={`/channel/${video.creator}`} className="flex items-center gap-1 text-sm text-ink hover:text-brand">
          {creator?.name ?? video.creator}
          {creator?.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand" aria-label="Verified" />}
        </Link>
        {onAddToPlaylist && (
          <button onClick={onAddToPlaylist} aria-label="Add to Playlist" title="Add to Playlist" className="ml-auto text-muted hover:text-brand">
            <ListPlus className="h-4 w-4" />
          </button>
        )}
      </div>
      <Link href={`/watch/${video.id}`} className="mt-[3px] line-clamp-2 text-base leading-[17px] text-ink hover:text-white">
        {video.title}
      </Link>
      <div className="mt-[4px] flex items-center gap-2 text-xs text-dim">
        <span>{formatCount(video.views)} views</span>
        <span className={`flex items-center gap-[2px] font-bold ${pct >= 90 ? "text-approve" : "text-ink"}`}>
          <ThumbsUp className="h-3 w-3" /> {pct}%
        </span>
        <span>{timeAgo(video.uploadedAt)}</span>
      </div>
    </div>
  );
}

export function VideoGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 gap-x-[10px] gap-y-[20px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}>{children}</div>
  );
}
