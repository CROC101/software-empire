import type { Sort } from "@/components/ui/Dropdown";
import type { VideoItem } from "@/types/media";
import { approval } from "./format";

export function sortVideos(list: VideoItem[], sort: Sort) {
  const out = [...list];
  if (sort === "Most Viewed") out.sort((a, b) => b.views - a.views);
  if (sort === "Top Rated") out.sort((a, b) => approval(b.likes, b.dislikes) - approval(a.likes, a.dislikes));
  if (sort === "Most Recent") out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  if (sort === "Longest") out.sort((a, b) => b.duration - a.duration);
  return out;
}
