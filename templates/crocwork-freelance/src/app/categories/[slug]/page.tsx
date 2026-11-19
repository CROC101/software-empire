import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { categories, isCategorySlug } from '@/data/categories';
import { CategoryClient } from './CategoryClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCategorySlug(slug)) notFound();
  return (
    <Suspense>
      <CategoryClient slug={slug} />
    </Suspense>
  );
}
