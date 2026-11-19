import TagView from './TagView';
import { tags } from '@/data/seed-tiktok';

export const dynamicParams = false;

export function generateStaticParams() {
  return tags.map((tag) => ({ tag }));
}

export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  return <TagView tag={(await params).tag} />;
}
