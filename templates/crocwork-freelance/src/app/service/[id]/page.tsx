import { Suspense } from 'react';
import { seedServiceIds } from '@/data/services';
import { ServiceClient } from './ServiceClient';

export const dynamicParams = false;

export function generateStaticParams() {
  // 'local' serves gigs published in this browser: /service/local/?id=...
  return [...seedServiceIds.map((id) => ({ id })), { id: 'local' }];
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <ServiceClient routeId={id} />
    </Suspense>
  );
}
