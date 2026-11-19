"use client";

import Link from "next/link";
import { useState } from "react";
import { useHub } from "@/context/MediaHubContext";
import { categories, getCategory } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { VideoCard, VideoGrid } from "@/components/video/VideoCard";
import { Dropdown, SORTS, type Sort } from "@/components/ui/Dropdown";
import { sortVideos } from "@/lib/sort";

export function CategoryView({ slug }: { slug: string }) {
  const { videos } = useHub();
  const [sort, setSort] = useState<Sort>("Most Viewed");
  const cat = getCategory(slug);
  if (!cat) return null;
  const list = sortVideos(videos.filter((v) => v.category === slug), sort);
  return (
    <div>
      <div className="relative h-[160px] overflow-hidden">
        <CoverArt seed={cat.slug} palette={cat.palette} />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-site px-[10px] pb-[15px] xl:px-0">
          <p className="text-xs">
            <Link href="/categories" className="text-brand-text hover:underline">Categories</Link> <span className="text-muted">/</span>
          </p>
          <h1 className="text-hero font-bold leading-[45px] text-white">{cat.name}</h1>
          <p className="text-md text-ink">
            {cat.videoCount.toLocaleString("en-US")} videos · {cat.description}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[15px] xl:px-0">
        <div className="mb-[15px] flex flex-wrap items-center gap-2">
          {cat.trendingTags.map((t) => (
            <Link key={t} href={`/videos?tag=${encodeURIComponent(t)}`} className="rounded-pill bg-surface px-4 py-2 text-base text-white hover:text-brand">
              #{t}
            </Link>
          ))}
          <div className="ml-auto">
            <Dropdown label="Sort" value={sort} options={SORTS} onChange={setSort} />
          </div>
        </div>
        {list.length ? (
          <VideoGrid>
            {list.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </VideoGrid>
        ) : (
          <p className="text-base text-muted">No videos yet. <Link href="/upload" className="text-brand-text">Upload the first one</Link>.</p>
        )}
        <h2 className="mb-2 mt-[30px] text-lg font-bold text-white">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}`} className="rounded-pill bg-pill px-3 py-1 text-sm text-ink hover:text-brand">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
