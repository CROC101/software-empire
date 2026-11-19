import { CUSTOM_SLOTS, PLAYLISTS } from '@/data/seed-spotify';
import PlaylistView from '@/components/views/PlaylistView';

export const dynamicParams = false;
// Custom playlists live in the browser, so a fixed set of slot ids is pre-built for them.
export function generateStaticParams() {
  return [...PLAYLISTS.map((p) => p.id), ...CUSTOM_SLOTS].map((id) => ({ id }));
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaylistView id={id} />;
}
