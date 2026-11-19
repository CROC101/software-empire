'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ListingView, isSortKey } from '@/components/ListingView';

function SearchInner() {
  const sp = useSearchParams();
  const q = sp.get('q') ?? '';
  const sort = sp.get('sort');
  return <ListingView key={q} query={q} initialSort={isSortKey(sort) ? sort : 'recommended'} />;
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
