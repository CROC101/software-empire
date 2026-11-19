'use client';

import { useSearchParams } from 'next/navigation';
import { ListingView } from '@/components/ListingView';
import type { CategorySlug } from '@/lib/types';

export function CategoryClient({ slug }: { slug: CategorySlug }) {
  const sub = useSearchParams().get('sub') ?? '';
  return <ListingView key={`${slug}-${sub}`} category={slug} sub={sub} />;
}
