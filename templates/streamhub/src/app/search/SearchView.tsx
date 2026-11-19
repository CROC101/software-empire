"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useHub } from "@/context/MediaHubContext";
import { categories, channels } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { VideoCard, VideoGrid } from "@/components/video/VideoCard";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import { formatCount } from "@/lib/format";

const TABS = ["Videos", "Channels", "Categories", "Playlists"] as const;
type Tab = (typeof TABS)[number];

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const hub = useHub();
  const q = (params.get("q") ?? "").trim();
  const tab: Tab = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "Videos";
  const has = (...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q.toLowerCase()));

  const results = {
    Videos: hub.videos.filter((v) => has(v.title, v.description, v.creator, v.category, ...v.tags)),
    Channels: channels.filter((c) => has(c.name, c.handle, c.bio)),
    Categories: categories.filter((c) => has(c.name, c.slug, c.description, ...c.trendingTags)),
    Playlists: hub.allPlaylists.filter((p) => has(p.name)),
  };
  const go = (t: Tab) => router.replace(`/search?q=${encodeURIComponent(q)}&tab=${t}`);

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="text-xl font-bold text-white">
        {q ? <>Results for “<span className="text-brand">{q}</span>”</> : "Browse everything"}
      </h1>
      <div role="tablist" className="no-scrollbar mb-[15px] mt-[10px] flex overflow-x-auto border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tab}
            onClick={() => go(t)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-md font-bold ${t === tab ? "border-brand text-brand" : "border-transparent text-ink hover:text-white"}`}
          >
            {t} <span className="text-muted">({results[t].length})</span>
          </button>
        ))}
      </div>

      {results[tab].length === 0 && <p className="rounded-[3px] bg-surface p-10 text-center text-base text-ink">No {tab.toLowerCase()} match “{q}”.</p>}

      {tab === "Videos" && (
        <VideoGrid>
          {results.Videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </VideoGrid>
      )}
      {tab === "Channels" && (
        <ul className="space-y-[8px]">
          {results.Channels.map((c) => (
            <li key={c.handle} className="flex items-center gap-3 rounded-[3px] bg-surface p-[10px]">
              <Link href={`/channel/${c.handle}`} className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-full">
                <CoverArt seed={c.handle} palette={c.palette} label={c.name[0]} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/channel/${c.handle}`} className="text-base font-bold text-white hover:text-brand">{c.name}</Link>
                <p className="text-sm text-muted">{formatCount(c.subscribers)} subscribers · {formatCount(c.totalViews)} views</p>
              </div>
              <SubscribeButton handle={c.handle} />
            </li>
          ))}
        </ul>
      )}
      {tab === "Categories" && (
        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4">
          {results.Categories.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="group">
              <span className="block aspect-video overflow-hidden rounded-thumb"><CoverArt seed={c.slug} palette={c.palette} label={c.name} /></span>
              <span className="mt-1 block text-base text-white group-hover:text-brand">{c.name}</span>
              <span className="text-sm text-muted">{c.videoCount} videos</span>
            </Link>
          ))}
        </div>
      )}
      {tab === "Playlists" && (
        <ul className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 md:grid-cols-3">
          {results.Playlists.map((p) => (
            <li key={p.id}>
              <Link href={`/playlists/${p.id}`} className="flex items-center justify-between rounded-[3px] bg-surface p-[12px] text-base text-white hover:bg-pill">
                {p.name} <span className="text-sm text-muted">{p.videoIds.length} videos</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
