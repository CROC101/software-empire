'use client';

import { Hash } from 'lucide-react';
import VideoGridPage from '@/components/feed/VideoGridPage';

export default function TagView({ tag }: { tag: string }) {
  return <VideoGridPage title={`#${tag}`} subtitle="Hashtag" hue={['#fe2c55', '#25f4ee']} icon={<Hash size={64} />} match={(v) => v.tags.includes(tag)} />;
}
