import FeedView, { type FeedType } from './FeedView';

const TYPES: FeedType[] = ['subscriptions', 'history', 'playlists', 'you'];

export const dynamicParams = false;

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export default async function FeedPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <FeedView type={type as FeedType} />;
}
