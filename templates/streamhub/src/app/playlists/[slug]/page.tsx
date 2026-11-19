import { PLAYLIST_SLOTS } from "@/data/seed-media";
import { PlaylistView } from "./PlaylistView";

export const dynamicParams = false;
export function generateStaticParams() {
  return ["watch-later", "favorites", "history", ...PLAYLIST_SLOTS].map((slug) => ({ slug }));
}

export default async function PlaylistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlaylistView slug={slug} />;
}
