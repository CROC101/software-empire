"use client";

import Link from "next/link";
import { useState } from "react";
import { useHub } from "@/context/MediaHubContext";
import { getChannel } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { Pill } from "@/components/ui/Dropdown";
import { approval, formatCount, formatDuration, seeded } from "@/lib/format";
import type { VideoItem } from "@/types/media";

const TIMEFRAMES = ["Today", "This Week", "This Month", "All Time"] as const;
const METRICS = ["Most Viewed", "Top Rated", "Most Favorited"] as const;
const WINDOW_DAYS = { Today: 7, "This Week": 14, "This Month": 31, "All Time": 9999 };

const score = (v: VideoItem, m: (typeof METRICS)[number]) =>
  m === "Most Viewed" ? v.views : m === "Top Rated" ? approval(v.likes, v.dislikes) * 1e6 + v.likes : v.favorites;

export default function TrendingPage() {
  const { videos } = useHub();
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("This Week");
  const [metric, setMetric] = useState<(typeof METRICS)[number]>("Most Viewed");
  const cutoff = new Date("2026-11-17").getTime() - WINDOW_DAYS[tf] * 86_400_000;
  const pool = videos.filter((v) => new Date(v.uploadedAt).getTime() >= cutoff);
  const ranked = [...(pool.length ? pool : videos)].sort((a, b) => score(b, metric) - score(a, metric));

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="text-xl font-bold text-white">Trending Charts</h1>
      <div className="no-scrollbar mt-[15px] flex gap-2 overflow-x-auto">
        {TIMEFRAMES.map((t) => (
          <Pill key={t} active={t === tf} onClick={() => setTf(t)}>{t}</Pill>
        ))}
      </div>
      <div role="tablist" className="mt-[15px] flex border-b border-hairline">
        {METRICS.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={m === metric}
            onClick={() => setMetric(m)}
            className={`-mb-px border-b-2 px-4 py-2 text-md font-bold ${m === metric ? "border-brand text-brand" : "border-transparent text-ink hover:text-white"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <ol className="mt-[15px] space-y-[8px]">
        {ranked.map((v, i) => {
          // Rank movement is a stable demo value per (video, timeframe, metric).
          const r = seeded(`${v.id}${tf}${metric}`);
          const move = Math.round(r() * 10) - 4;
          return (
            <li key={v.id} className="flex items-center gap-3 rounded-[3px] bg-surface p-[8px] hover:bg-pill">
              <span className={`w-[36px] text-center text-2xl font-bold ${i < 3 ? "text-brand" : "text-white"}`}>{i + 1}</span>
              <span className={`w-[42px] text-xs font-bold ${move > 0 ? "text-approve" : move < 0 ? "text-red-400" : "text-muted"}`}>
                {move > 0 ? `▲ +${move}` : move < 0 ? `▼ ${move}` : "— 0"}
              </span>
              <Link href={`/watch/${v.id}`} className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-thumb sm:w-[160px]">
                <CoverArt seed={v.id} palette={v.palette} />
                <span className="absolute bottom-1 right-1 rounded-thumb bg-black/75 px-1 text-2xs font-bold text-white">{formatDuration(v.duration)}</span>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/watch/${v.id}`} className="line-clamp-2 text-base text-white hover:text-brand">{v.title}</Link>
                <Link href={`/channel/${v.creator}`} className="text-sm text-ink hover:text-brand">{getChannel(v.creator)?.name ?? v.creator}</Link>
              </div>
              <div className="hidden w-[110px] text-right text-sm sm:block">
                <p className="font-bold text-white">{formatCount(v.views)} views</p>
                <p className="font-bold text-approve">{approval(v.likes, v.dislikes)}%</p>
                <p className="text-muted">{formatCount(v.favorites)} favs</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
