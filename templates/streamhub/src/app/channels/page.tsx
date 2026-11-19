import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { channels } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import { formatCount } from "@/lib/format";

export const metadata = { title: "Creators & Channels - StreamHub" };

const MEDAL = ["bg-[#f5c518] text-black", "bg-[#c0c0c0] text-black", "bg-[#cd7f32] text-black"];

export default function ChannelsPage() {
  const ranked = [...channels].sort((a, b) => a.rank - b.rank);
  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="mb-[15px] text-xl font-bold text-white">Top Verified Creators & Studios</h1>
      <ol className="space-y-[8px]">
        {ranked.map((c) => (
          <li key={c.handle} className="flex flex-wrap items-center gap-[12px] rounded-[3px] border border-hairline bg-surface p-[10px] hover:border-brand/50">
            <span className={`flex h-[34px] min-w-[64px] items-center justify-center rounded-[3px] text-md font-bold ${MEDAL[c.rank - 1] ?? "bg-pill text-white"}`}>
              Rank #{c.rank}
            </span>
            <Link href={`/channel/${c.handle}`} className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full">
              <CoverArt seed={c.handle} palette={c.palette} />
            </Link>
            <div className="min-w-[160px] flex-1">
              <Link href={`/channel/${c.handle}`} className="flex items-center gap-1 text-base font-bold text-white hover:text-brand">
                {c.name} {c.verified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />}
              </Link>
              <p className="text-sm text-muted">@{c.handle}</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{formatCount(c.subscribers)}</p>
              <p className="text-xs text-muted">Subscribers</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{formatCount(c.totalViews)}</p>
              <p className="text-xs text-muted">Video Views</p>
            </div>
            <SubscribeButton handle={c.handle} />
          </li>
        ))}
      </ol>
    </div>
  );
}
