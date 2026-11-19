import { ORDER_POOL } from '@/data/seed-tiktok';
import OrderView from './OrderView';

// shortcut: static export needs every id up front, so new orders reuse a pool of 60 ids; raise ORDER_POOL if needed
export function generateStaticParams() {
  return ORDER_POOL.map((orderId) => ({ orderId }));
}

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  return <OrderView id={(await params).orderId} />;
}
