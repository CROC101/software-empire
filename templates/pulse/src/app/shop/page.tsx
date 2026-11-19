'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ShoppingBag, Ticket } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import FlashSaleBanner from '@/components/shop/FlashSaleBanner';
import ProductCard from '@/components/shop/ProductCard';
import { vouchers } from '@/data/seed-tiktok';
import type { ProductCategory } from '@/types/tiktok';

const CATS: ('All' | ProductCategory)[] = ['All', 'Electronics', 'Keyboards & Gear', 'Apparel', 'Audio', 'Accessories'];
const SORTS = ['Best Selling', 'Price Low→High', 'Top Rated'] as const;

export default function ShopPage() {
  const { products, claimed, claimVoucher } = useTikTok();
  const { toast } = useUI();
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Best Selling');

  const list = products
    .filter((p) => cat === 'All' || p.category === cat)
    .sort((a, b) => (sort === 'Best Selling' ? b.sold - a.sold : sort === 'Top Rated' ? b.rating - a.rating : a.price - b.price));
  const hero = products[0];

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 px-4 pb-16 pt-[64px] md:px-8 md:pt-6">
      <h1 className="text-24 font-bold md:pr-[400px]">Shop</h1>

      <section className="relative flex min-h-[200px] items-center overflow-hidden rounded-lg bg-gradient-to-r from-[#fe2c55] via-[#ff6b00] to-[#ffb800] p-6 text-white md:p-10">
        <div className="relative z-10 max-w-[60%]">
          <p className="text-13 font-bold tracking-widest uppercase opacity-90">Mega Payday Sale</p>
          <h2 className="mt-1 text-[28px] leading-8 font-extrabold md:text-[40px] md:leading-[44px]">Up to 60% off desk gear</h2>
          <p className="mt-2 text-14 opacity-90">Free shipping nationwide · Cashback every order</p>
          <Link href={`/shop/product/${hero.id}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-pill bg-white px-5 text-15 font-bold text-brand"><ShoppingBag size={16} />Shop now</Link>
        </div>
        <ProductArt hue={hero.hue} icon={hero.icon} angle={-12} className="absolute -right-6 top-1/2 h-56 w-56 -translate-y-1/2 rounded-[32px] opacity-90 md:right-10" />
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Vouchers">
        {vouchers.map((v) => {
          const got = claimed.includes(v.id);
          return (
            <div key={v.id} className="flex items-center gap-3 rounded-lg border border-dashed border-brand/50 bg-brand/5 p-3">
              <Ticket className="shrink-0 text-brand" size={28} />
              <div className="min-w-0 flex-1"><p className="text-15 font-bold text-brand">{v.label}</p><p className="truncate text-12 text-muted">{v.detail}</p></div>
              <button disabled={got} onClick={() => { claimVoucher(v.id); toast(`${v.label} claimed · applied at checkout`); }}
                className="flex h-8 shrink-0 items-center gap-1 rounded-pill bg-brand px-3 text-13 font-bold text-white disabled:bg-pill disabled:text-muted">
                {got ? <><Check size={14} />Claimed</> : 'Claim'}
              </button>
            </div>
          );
        })}
      </section>

      <FlashSaleBanner products={products} />

      <section>
        <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 bg-canvas px-4 py-3 md:-mx-8 md:px-8">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar" role="tablist">
            {CATS.map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`h-9 shrink-0 rounded-md px-3 text-14 font-semibold ${cat === c ? 'bg-ink text-canvas' : 'bg-pill hover:bg-pill-hover'}`}>{c}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-14 text-muted">Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])} className="h-9 rounded-md bg-pill px-2 text-14 font-semibold text-ink outline-none">
              {SORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
