import Link from "next/link";
import { categories } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";

export const metadata = { title: "Categories - StreamHub" };

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="mb-[15px] text-xl font-bold text-white">All Categories</h1>
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.slug} className="group overflow-hidden rounded-[3px] border border-hairline bg-surface hover:border-brand/50">
            <Link href={`/categories/${c.slug}`} className="relative block aspect-video">
              <CoverArt seed={c.slug} palette={c.palette} label={c.name.split(" ")[0]} />
              <span className="absolute right-[6px] top-[6px] rounded-thumb bg-black/75 px-[6px] py-[2px] text-xs font-bold text-white">
                {c.videoCount.toLocaleString("en-US")} videos
              </span>
            </Link>
            <div className="p-[10px]">
              <Link href={`/categories/${c.slug}`} className="text-base font-bold text-white group-hover:text-brand">
                {c.name}
              </Link>
              <p className="mt-1 text-sm text-ink">{c.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.trendingTags.map((t) => (
                  <Link key={t} href={`/videos?tag=${encodeURIComponent(t)}`} className="rounded-[2px] bg-pill px-2 py-0.5 text-xs text-ink hover:text-brand">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
