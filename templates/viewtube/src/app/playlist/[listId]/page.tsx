import { CUSTOM_PLAYLIST_SLOTS, SEED_PLAYLISTS } from '@/data/seed-youtube';
import PlaylistView from './PlaylistView';

export const dynamicParams = false;

export function generateStaticParams() {
  return ['WL', 'LL', ...SEED_PLAYLISTS.map((p) => p.id), ...CUSTOM_PLAYLIST_SLOTS].map((listId) => ({ listId }));
}

export default async function PlaylistPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return <PlaylistView listId={listId} />;
}
