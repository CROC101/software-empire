import MusicView from './MusicView';
import { music } from '@/data/seed-tiktok';

export const dynamicParams = false;

export function generateStaticParams() {
  return music.map((m) => ({ musicId: m.id }));
}

export default async function Page({ params }: { params: Promise<{ musicId: string }> }) {
  return <MusicView id={(await params).musicId} />;
}
