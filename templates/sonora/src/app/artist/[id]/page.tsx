import { notFound } from 'next/navigation';
import { ARTISTS, getArtist } from '@/data/seed-spotify';
import ArtistView from '@/components/views/ArtistView';

export const dynamicParams = false;
export function generateStaticParams() {
  return ARTISTS.map((a) => ({ id: a.id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getArtist(id)) notFound();
  return <ArtistView id={id} />;
}
