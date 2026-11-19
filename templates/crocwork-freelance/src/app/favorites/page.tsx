'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { brand } from '@/config/brand.config';
import { useAllServices, useStore } from '@/store/useStore';
import { ServiceCard, ServiceCardSkeleton } from '@/components/ServiceCard';

export default function FavoritesPage() {
  const hydrated = useStore((s) => s.hydrated);
  const favorites = useStore((s) => s.favorites);
  const all = useAllServices();
  const saved = useMemo(() => favorites.flatMap((id) => all.filter((s) => s.id === id)), [favorites, all]);

  return (
    <div className="container-fw py-8">
      <h1 className="text-2xl font-semibold text-ink">งานที่ชื่นชอบ</h1>
      {!hydrated ? (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <ServiceCardSkeleton key={i} />)}</div>
      ) : saved.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Image src={brand.mascots.empty} alt="" width={200} height={160} />
          <p className="mt-4 text-lg font-semibold text-ink">ยังไม่มีงานที่บันทึกไว้</p>
          <p className="mt-1 text-sm text-ink-3">กดรูปหัวใจบนบริการที่ถูกใจเพื่อบันทึกไว้ดูภายหลัง</p>
          <Link href="/search/" className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">ค้นหาบริการ</Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-3">{saved.length} รายการ</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{saved.map((s) => <ServiceCard key={s.id} service={s} />)}</div>
        </>
      )}
    </div>
  );
}
