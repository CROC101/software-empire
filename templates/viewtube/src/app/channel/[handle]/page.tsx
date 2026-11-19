import { CHANNELS } from '@/data/seed-youtube';
import ChannelView from './ChannelView';

export const dynamicParams = false;

export function generateStaticParams() {
  return CHANNELS.map((c) => ({ handle: c.id }));
}

export default async function ChannelPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <ChannelView id={handle} />;
}
