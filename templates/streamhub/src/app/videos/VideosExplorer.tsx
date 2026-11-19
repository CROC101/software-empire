"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { getChannel } from "@/data/seed-media";
import { MultiTagSidebar, type DurationFilter, type Flag, type TagFilterState } from "@/components/video/MultiTagSidebar";
import { VideoCard } from "@/components/video/VideoCard";
import { Dropdown, SORTS, type Sort } from "@/components/ui/Dropdown";
import { sortVideos } from "@/lib/sort";
import type { VideoItem } from "@/types/media";

const EMPTY: TagFilterState = { include: [], exclude: [], duration: "All", flags: [] };

export function matches(v: VideoItem, f: TagFilterState) {
  const tags = v.tags.map((t) => t.toLowerCase());
  if (!f.include.every((t) => tags.includes(t.toLowerCase()))) return false;
  if (f.exclude.some((t) => tags.includes(t.toLowerCase()))) return false;
  const min = v.duration / 60;
  if (f.duration === "0–10 min" && min > 10) return false;
  if (f.duration === "10–30 min" && (min <= 10 || min > 30)) return false;
  if (f.duration === "30+ min" && min <= 30) return false;
  if (f.flags.includes("4K Ultra HD") && v.quality !== "4K") return false;
  if (f.flags.includes("60 FPS") && v.fps !== 60) return false;
  if (f.flags.includes("Verified Creators Only") && !getChannel(v.creator)?.verified) return false;
  if (f.flags.includes("Full Length") && !v.fullLength) return false;
  return true;
}

export function VideosExplorer() {
  const params = useSearchParams();
  const { videos } = useHub();
  const [filters, setFilters] = useState<TagFilterState>(EMPTY);
  const [sort, setSort] = useState<Sort>("Most Viewed");
  const [open, setOpen] = useState(true);

  const tagParam = params.get("tag");
  useEffect(() => {
    if (tagParam) setFilters({ ...EMPTY, include: [tagParam] });
  }, [tagParam]);

  const results = useMemo(() => sortVideos(videos.filter((v) => matches(v, filters)), sort), [videos, filters, sort]);

  const onTag = (tag: string, mode: "include" | "exclude") =>
    setFilters((f) => {
      const other = mode === "include" ? "exclude" : "include";
      const has = f[mode].includes(tag);
      return { ...f, [mode]: has ? f[mode].filter((t) => t !== tag) : [...f[mode], tag], [other]: f[other].filter((t) => t !== tag) };
    });
  const onFlag = (flag: Flag) =>
    setFilters((f) => ({ ...f, flags: f.flags.includes(flag) ? f.flags.filter((x) => x !== flag) : [...f.flags, flag] }));
  const onDuration = (d: DurationFilter) => setFilters((f) => ({ ...f, duration: d }));

  const chips = [
    ...filters.include.map((t) => ({ key: `+${t}`, label: `+ #${t}`, clear: () => onTag(t, "include") })),
    ...filters.exclude.map((t) => ({ key: `-${t}`, label: `− #${t}`, clear: () => onTag(t, "exclude") })),
    ...(filters.duration !== "All" ? [{ key: "dur", label: filters.duration, clear: () => onDuration("All") }] : []),
    ...filters.flags.map((f) => ({ key: f, label: f, clear: () => onFlag(f) })),
  ];

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <div className="mb-[15px] flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-white">Advanced Video Explorer</h1>
        {!open && (
          <button onClick={() => setOpen(true)} className="flex h-[32px] items-center gap-2 rounded-[3px] bg-pill px-3 text-sm text-ink hover:bg-pill-hover">
            <SlidersHorizontal className="h-4 w-4" /> Show filters
          </button>
        )}
        <span className="text-md text-ink" aria-live="polite">
          <span className="font-bold text-brand">{results.length}</span> of {videos.length} videos
        </span>
        <div className="ml-auto">
          <Dropdown label="Sort" value={sort} options={SORTS} onChange={setSort} />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-[15px] flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.key} onClick={c.clear} className="flex items-center gap-1 rounded-pill border border-brand/50 bg-pill px-3 py-1 text-sm font-bold text-white hover:bg-pill-hover">
              {c.label} <X className="h-3.5 w-3.5 text-brand" />
            </button>
          ))}
          <button onClick={() => setFilters(EMPTY)} className="ml-1 text-sm font-bold text-brand-text hover:underline">
            Clear All Filters
          </button>
        </div>
      )}

      <div className="flex flex-col gap-[20px] lg:flex-row">
        <MultiTagSidebar state={filters} onTag={onTag} onDuration={onDuration} onFlag={onFlag} open={open} onClose={() => setOpen(false)} />
        <div className="min-w-0 flex-1">
          {results.length ? (
            <div className={`grid grid-cols-1 gap-x-[10px] gap-y-[20px] sm:grid-cols-2 md:grid-cols-3 ${open ? "" : "lg:grid-cols-4"}`}>
              {results.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          ) : (
            <div className="rounded-[3px] border border-hairline bg-surface p-10 text-center text-base text-ink">
              No videos match these filters.{" "}
              <button onClick={() => setFilters(EMPTY)} className="font-bold text-brand-text hover:underline">
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
