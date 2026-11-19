'use client';

import Link from 'next/link';
import { ShoppingCart, Truck } from 'lucide-react';
import { ProductArt, Stars } from '@/components/common/Visuals';
import { useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { firstPicks, keyOf } from './VariantPicker';
import { baht, fmtCount, totalStock } from '@/lib/format';
import type { Product } from '@/types/tiktok';

export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart } = useTikTok();
  const { toast } = useUI();
  const out = totalStock(p) === 0;
  const off = Math.round((1 - p.price / p.originalPrice) * 100);
  const add = () => {
    const key = keyOf(p, firstPicks(p));
    if ((p.stock[key] ?? 0) < 1) { toast('That option is sold out'); return; }
    addToCart(p.id, key, 1);
    toast('Added to cart');
  };
  return (
    <div className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-card">
      <Link href={`/shop/product/${p.id}`} className="relative block aspect-square">
        <ProductArt hue={p.hue} icon={p.icon} className="h-full w-full transition-transform group-hover:scale-105" />
        {off > 0 && <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 text-12 font-bold text-white">-{off}%</span>}
        {out && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-15 font-bold text-white">Sold out</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/shop/product/${p.id}`} className="line-clamp-2 text-14 leading-5 font-medium hover:underline">{p.name}</Link>
        <p className="mt-1 flex items-center gap-1 text-12 text-muted"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {fmtCount(p.sold)} sold</p>
        {p.freeShipping && <p className="mt-1 flex w-fit items-center gap-1 rounded-sm bg-[#00a87e]/10 px-1.5 text-11 font-semibold text-[#00a87e]"><Truck size={11} />Free shipping</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="text-17 font-bold text-deal">{baht(p.price)}{off > 0 && <span className="ml-1 text-12 font-normal text-muted line-through">{baht(p.originalPrice)}</span>}</p>
          <button onClick={add} disabled={out} aria-label={`Add ${p.name} to cart`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"><ShoppingCart size={15} /></button>
        </div>
      </div>
    </div>
  );
}
