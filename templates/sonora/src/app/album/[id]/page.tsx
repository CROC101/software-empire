import { notFound } from 'next/navigation';
import { ALBUMS, getAlbum } from '@/data/seed-spotify';
import AlbumView from '@/components/views/AlbumView';

export const dynamicParams = false;
export function generateStaticParams() {
  return ALBUMS.map((a) => ({ id: a.id }));
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getAlbum(id)) notFound();
  return <AlbumView id={id} />;
}
