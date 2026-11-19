import { notFound } from 'next/navigation';
import { SECTIONS } from '@/data/seed-spotify';
import SectionView from '@/components/views/SectionView';

export const dynamicParams = false;
export function generateStaticParams() {
  return SECTIONS.map((s) => ({ id: s.id }));
}

export default async function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) notFound();
  return <SectionView id={id} />;
}
