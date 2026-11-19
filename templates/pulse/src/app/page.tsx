'use client';

import ForYouFeed from '@/components/feed/ForYouFeed';
import { useTikTok } from '@/context/TikTokContext';

export default function ForYouPage() {
  const { videos } = useTikTok();
  return <ForYouFeed videos={videos} showTip />;
}
