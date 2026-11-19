import { notFound } from 'next/navigation';
import { GENRES, PODCAST_HUB, genreBySlug } from '@/data/seed-spotify';
import GenreView from '@/components/views/GenreView';

export const dynamicParams = false;
export function generateStaticParams() {
  return [...GENRES, PODCAST_HUB].map((g) => ({ slug: g.slug }));
}

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!genreBySlug(slug)) notFound();
  return <GenreView slug={slug} />;
}
