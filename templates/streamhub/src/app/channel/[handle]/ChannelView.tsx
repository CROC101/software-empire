"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { getChannel } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { VideoCard, VideoGrid } from "@/components/video/VideoCard";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import { formatCount } from "@/lib/format";

const TABS = ["Videos", "Playlists", "About"] as const;

export function ChannelView({ handle }: { handle: string }) {
  const { videos, subscriptions } = useHub();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Videos");
  const c = getChannel(handle);
  if (!c) return null;
  const list = videos.filter((v) => v.creator === c.handle);
  const byCategory = [...new Set(list.map((v) => v.category))];
  const subs = c.subscribers + (subscriptions.includes(c.handle) ? 1 : 0);

  return (
    <div>
      <div className="h-[180px] overflow-hidden">
        <CoverArt seed={`${c.handle}-banner`} palette={c.palette} />
      </div>
      <div className="mx-auto max-w-site px-[10px] pb-[40px] xl:px-0">
        <div className="-mt-[40px] flex flex-wrap items-end gap-4">
          <div className="h-[100px] w-[100px] overflow-hidden rounded-full border-4 border-black">
            <CoverArt seed={c.handle} palette={c.palette} />
          </div>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              {c.name} {c.verified && <BadgeCheck className="h-5 w-5 text-brand" aria-label="Verified" />}
            </h1>
            <p className="text-md text-muted">@{c.handle}</p>
          </div>
          <SubscribeButton handle={c.handle} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-[480px]">
          {[["Subscribers", formatCount(subs)], ["Video Views", formatCount(c.totalViews)], ["Rank", `#${c.rank}`]].map(([k, v]) => (
            <div key={k} className="rounded-[3px] bg-surface p-3 text-center">
              <p className="text-xl font-bold text-brand">{v}</p>
              <p className="text-xs text-muted">{k}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 max-w-[750px] text-md text-ink">{c.bio}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {c.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand-text hover:underline">
              {s.label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>

        <div role="tablist" className="mt-[20px] flex border-b border-hairline">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-md font-bold ${tab === t ? "border-brand text-brand" : "border-transparent text-ink hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="pt-[15px]">
          {tab === "Videos" && (
            <VideoGrid>
              {list.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </VideoGrid>
          )}
          {tab === "Playlists" && (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {byCategory.map((cat) => {
                const vids = list.filter((v) => v.category === cat);
                return (
                  <li key={cat}>
                    <Link href={`/categories/${cat}`} className="flex items-center gap-3 rounded-[3px] bg-surface p-2 hover:bg-pill">
                      <span className="aspect-video w-[120px] overflow-hidden rounded-thumb">
                        <CoverArt seed={vids[0].id} palette={vids[0].palette} />
                      </span>
                      <span>
                        <span className="block text-base font-bold text-white">{c.name}: {cat.replace(/-/g, " ")}</span>
                        <span className="text-sm text-muted">{vids.length} videos</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === "About" && (
            <div className="max-w-[750px] space-y-2 text-md text-ink">
              <p>{c.bio}</p>
              <p>Joined {new Date(c.joined).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              <p>{list.length} videos on StreamHub · {c.totalViews.toLocaleString("en-US")} total views</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
