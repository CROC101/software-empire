import { products, PRODUCT_POOL } from '@/data/seed-tiktok';
import ProductView from './ProductView';

// shortcut: static export needs every id up front, so seller-added products use a pre-made pool of 30 ids; raise PRODUCT_POOL if sellers need more
export function generateStaticParams() {
  return [...products.map((p) => p.id), ...PRODUCT_POOL].map((productId) => ({ productId }));
}

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  return <ProductView id={(await params).productId} />;
}
