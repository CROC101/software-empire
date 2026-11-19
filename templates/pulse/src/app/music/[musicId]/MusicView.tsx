'use client';

import { Music2 } from 'lucide-react';
import VideoGridPage from '@/components/feed/VideoGridPage';
import { music } from '@/data/seed-tiktok';

export default function MusicView({ id }: { id: string }) {
  const m = music.find((x) => x.id === id)!;
  return <VideoGridPage title={m.title} subtitle={m.artist} hue={m.hue} icon={<Music2 size={64} />} match={(v) => v.musicId === id} />;
}
