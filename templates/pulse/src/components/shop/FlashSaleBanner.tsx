'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { baht, totalStock } from '@/lib/format';
import type { Product } from '@/types/tiktok';

/** Seconds left until the next 3-hour flash window ends. */
function useFlashClock() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(3 * 3600 - (Math.floor(Date.now() / 1000) % (3 * 3600)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

export function FlashTimer({ className = '' }: { className?: string }) {
  const left = useFlashClock();
  const parts = left == null ? ['--', '--', '--'] : [left / 3600, (left % 3600) / 60, left % 60].map((x) => String(Math.floor(x)).padStart(2, '0'));
  return (
    <span className={`inline-flex items-center gap-1 font-mono ${className}`} aria-label="Flash sale ends in">
      {parts.map((x, i) => (
        <span key={i} className="flex items-center gap-1"><span className="rounded-sm bg-ink px-1.5 py-0.5 text-13 font-bold text-canvas">{x}</span>{i < 2 && ':'}</span>
      ))}
    </span>
  );
}

export default function FlashSaleBanner({ products }: { products: Product[] }) {
  const list = products.filter((p) => p.flashSale);
  if (!list.length) return null;
  return (
    <section className="rounded-lg bg-gradient-to-r from-brand/10 to-deal/10 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-1 text-20 font-extrabold text-brand"><Zap size={20} className="fill-brand" />Flash Sale</h2>
        <span className="text-13 text-muted">Ends in</span>
        <FlashTimer />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {list.map((p) => {
          const left = totalStock(p);
          const pct = Math.min(98, Math.round((p.sold / (p.sold + left)) * 100));
          return (
            <Link key={p.id} href={`/shop/product/${p.id}`} className="w-[150px] shrink-0 overflow-hidden rounded-md bg-card">
              <ProductArt hue={p.hue} icon={p.icon} className="aspect-square w-full" />
              <div className="p-2">
                <p className="text-16 font-bold text-deal">{baht(p.price)}</p>
                <p className="text-12 text-muted line-through">{baht(p.originalPrice)}</p>
                <div className="relative mt-1 h-4 overflow-hidden rounded-pill bg-brand/15">
                  <span className="absolute inset-y-0 left-0 rounded-pill bg-gradient-to-r from-deal to-brand" style={{ width: `${pct}%` }} />
                  <span className="relative block text-center text-11 leading-4 font-semibold text-white mix-blend-difference">{pct}% sold</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
