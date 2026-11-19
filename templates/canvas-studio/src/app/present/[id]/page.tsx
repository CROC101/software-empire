import { Suspense } from 'react';
import { DESIGN_SLOTS } from '@/lib/slots';
import { PresentClient } from './PresentClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return DESIGN_SLOTS.map((id) => ({ id }));
}

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <PresentClient id={id} />
    </Suspense>
  );
}
