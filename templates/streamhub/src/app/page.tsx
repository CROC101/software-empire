"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { VideoCard, VideoGrid } from "@/components/video/VideoCard";
import { AddToPlaylistModal } from "@/components/ui/Modal";
import { Dropdown, SORTS, type Sort } from "@/components/ui/Dropdown";
import { sortVideos } from "@/lib/sort";
import { ALL_TAGS, categories } from "@/data/seed-media";

const PER_PAGE = 8;
const REGIONS = ["Worldwide", "Thailand"] as const;

export default function HomePage() {
  const { videos, dismissed, dismiss, toast } = useHub();
  const [sort, setSort] = useState<Sort>("Most Viewed");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Worldwide");
  const [page, setPage] = useState(1);
  const [playlistFor, setPlaylistFor] = useState<string | null>(null);

  // Thailand view: a stable regional re-ordering of the same catalogue.
  const base = region === "Thailand" ? [...videos].reverse() : videos;
  const hot = sortVideos(base, sort);
  const pages = Math.max(1, Math.ceil(hot.length / PER_PAGE));
  const shown = hot.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const recommended = [...videos].sort((a, b) => b.favorites - a.favorites).filter((v) => !dismissed.includes(v.id)).slice(0, 8);

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <Link
        href="/upload"
        className="flex min-h-[61px] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-[3px] border border-brand/40 bg-surface px-4 py-2 text-center text-base text-ink hover:border-brand"
      >
        <Sparkles className="h-5 w-5 text-brand" />
        <span className="font-bold text-white">Premium unlocked:</span> 4K 60fps playback, full-length downloads, ad-free theater
        mode and unlimited playlists.
      </Link>

      <div className="mt-[20px] flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold leading-[21px] text-white">Hot Videos {region === "Thailand" ? "in Thailand" : "Worldwide"}</h1>
        <div className="flex gap-1">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRegion(r);
                setPage(1);
              }}
              className={`rounded-[2px] px-2 py-1 text-xs font-bold ${r === region ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Dropdown label="Sort" value={sort} options={SORTS} onChange={(s) => { setSort(s); setPage(1); }} />
        </div>
      </div>

      <ul className="no-scrollbar mt-[15px] flex gap-[8px] overflow-x-auto">
        {[...ALL_TAGS, ...categories.slice(0, 5).map((c) => c.name)].map((t) => (
          <li key={t} className="shrink-0">
            <Link
              href={ALL_TAGS.includes(t as (typeof ALL_TAGS)[number]) ? `/videos?tag=${encodeURIComponent(t)}` : `/categories/${categories.find((c) => c.name === t)?.slug}`}
              className="flex h-[41px] items-center rounded-pill bg-surface px-[16px] text-base text-white hover:bg-pill-hover hover:text-brand"
            >
              {t}
            </Link>
          </li>
        ))}
      </ul>

      <VideoGrid className="mt-[28px]">
        {shown.map((v) => (
          <VideoCard key={v.id} video={v} onAddToPlaylist={() => setPlaylistFor(v.id)} />
        ))}
      </VideoGrid>

      <nav aria-label="Pagination" className="mt-[30px] flex justify-center gap-[6px]">
        {Array.from({ length: Math.max(3, pages) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={n > pages}
            onClick={() => {
              setPage(n);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-current={n === page ? "page" : undefined}
            className={`h-[38px] min-w-[38px] rounded-[3px] px-3 text-base font-bold disabled:opacity-40 ${
              n === page ? "bg-brand text-black" : "bg-pill text-white hover:bg-pill-hover"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="h-[38px] rounded-[3px] bg-pill px-4 text-base font-bold text-white hover:bg-pill-hover disabled:opacity-40"
        >
          Next →
        </button>
      </nav>

      <section className="mt-[40px]">
        <div className="mb-[15px] flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recommended For You</h2>
          <Link href="/videos" className="text-sm text-brand-text hover:underline">
            See all
          </Link>
        </div>
        {recommended.length ? (
          <VideoGrid>
            {recommended.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onDismiss={() => {
                  dismiss(v.id);
                  toast("We'll show fewer videos like this");
                }}
                onAddToPlaylist={() => setPlaylistFor(v.id)}
              />
            ))}
          </VideoGrid>
        ) : (
          <p className="text-base text-muted">You dismissed every recommendation. Browse <Link href="/categories" className="text-brand-text">categories</Link> for more.</p>
        )}
      </section>
      <AddToPlaylistModal videoId={playlistFor} onClose={() => setPlaylistFor(null)} />
    </div>
  );
}
