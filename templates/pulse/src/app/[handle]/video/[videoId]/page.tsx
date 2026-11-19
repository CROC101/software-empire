import { ME, UPLOAD_POOL, videos } from '@/data/seed-tiktok';
import TheaterView from './TheaterView';

export const dynamicParams = false;

// shortcut: uploads reuse a pool of 30 ids under the demo account; raise UPLOAD_POOL for more
export function generateStaticParams() {
  return [
    ...videos.map((v) => ({ handle: '@' + v.handle, videoId: v.id })),
    ...UPLOAD_POOL.map((videoId) => ({ handle: '@' + ME, videoId })),
  ];
}

export default async function Page({ params }: { params: Promise<{ handle: string; videoId: string }> }) {
  return <TheaterView id={(await params).videoId} />;
}
