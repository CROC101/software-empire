import { notFound } from 'next/navigation';
import ProfileView from '@/components/profile/ProfileView';
import { creators } from '@/data/seed-tiktok';

export const dynamicParams = false;

export function generateStaticParams() {
  return creators.map((c) => ({ handle: '@' + c.handle }));
}

export default async function HandlePage({ params }: { params: Promise<{ handle: string }> }) {
  const raw = decodeURIComponent((await params).handle);
  if (!raw.startsWith('@')) notFound();
  return <ProfileView handle={raw.slice(1)} />;
}
