'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle, ShieldCheck, Store, Truck, Zap } from 'lucide-react';
import { Avatar, ProductArt, Stars, Verified } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import VariantPicker, { firstPicks, keyOf } from '@/components/shop/VariantPicker';
import { FlashTimer } from '@/components/shop/FlashSaleBanner';
import ProductCard from '@/components/shop/ProductCard';
import { baht, fmtCount, fmtTime } from '@/lib/format';
import type { Product } from '@/types/tiktok';

function Detail({ p }: { p: Product }) {
  const { products, addToCart, openThread, sendMessage } = useTikTok();
  const { creator } = useLookup();
  const { toast } = useUI();
  const router = useRouter();
  const [picks, setPicks] = useState(() => firstPicks(p));
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [stars, setStars] = useState(0);
  const shop = creator(p.shopHandle);
  const key = keyOf(p, picks);
  const stock = p.stock[key] ?? 0;
  const off = Math.round((1 - p.price / p.originalPrice) * 100);
  const counts = [5, 4, 3, 2, 1].map((s) => p.reviews.filter((r) => r.stars === s).length);
  const reviews = stars ? p.reviews.filter((r) => r.stars === stars) : p.reviews;
  const more = products.filter((x) => x.id !== p.id && (x.shopHandle === p.shopHandle || x.category === p.category)).slice(0, 5);

  const add = () => { if (stock < qty) return toast('Not enough stock for that option'); addToCart(p.id, key, qty); toast('Added to cart'); };
  const buy = () => { if (stock < qty) return toast('Not enough stock for that option'); router.push(`/checkout?buy=${p.id}&v=${encodeURIComponent(key)}&q=${qty}`); };
  const chat = () => { const t = openThread(p.shopHandle); sendMessage(t, `Hi! I have a question about "${p.name}".`); router.push(`/messages?t=${t}`); };

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-28 pt-[64px] md:px-8 md:pt-6">
      <nav className="mb-4 text-13 text-muted md:pr-[400px]"><Link href="/shop" className="hover:underline">Shop</Link> / {p.category} / <span className="text-ink">{p.name}</span></nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductArt hue={p.hue} icon={p.icon} angle={img * 18} className="aspect-square w-full rounded-lg" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`h-16 w-16 overflow-hidden rounded-md border-2 ${img === i ? 'border-brand' : 'border-transparent'}`}>
                <ProductArt hue={p.hue} icon={p.icon} angle={i * 18} className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-22 leading-7 font-bold">{p.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-14 text-muted"><Stars value={p.rating} size={14} /><b className="text-ink">{p.rating.toFixed(1)}</b> · {p.reviews.length} reviews · {fmtCount(p.sold)} sold</p>
          {p.flashSale && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-t-md bg-gradient-to-r from-brand to-deal px-4 py-2 text-white">
              <span className="flex items-center gap-1 text-15 font-extrabold"><Zap size={16} className="fill-white" />Flash Sale</span>
              <span className="flex items-center gap-2 text-13">Ends in <FlashTimer /></span>
            </div>
          )}
          <div className={`flex items-end gap-3 bg-pill px-4 py-3 ${p.flashSale ? 'rounded-b-md' : 'mt-4 rounded-md'}`}>
            <span className="text-[30px] leading-9 font-extrabold text-deal">{baht(p.price)}</span>
            {off > 0 && <><span className="pb-1 text-15 text-muted line-through">{baht(p.originalPrice)}</span><span className="mb-1 rounded-sm bg-brand px-1.5 text-12 font-bold text-white">-{off}%</span></>}
          </div>

          <div className="mt-4 space-y-2 text-14">
            <p className="flex items-start gap-2"><Truck size={18} className="mt-0.5 shrink-0 text-[#00a87e]" /><span><b>{p.freeShipping ? 'Free shipping' : 'Shipping from ฿35'}</b><br /><span className="text-muted">Estimated delivery: 2–3 days via Flash/Kerry Express</span></span></p>
            <p className="flex items-center gap-2 text-muted"><ShieldCheck size={18} className="shrink-0" />15-day free returns · Cash on delivery available</p>
          </div>

          <div className="mt-5"><VariantPicker product={p} picks={picks} setPicks={setPicks} qty={qty} setQty={setQty} /></div>

          <div className="mt-6 hidden gap-3 md:flex">
            <button onClick={add} disabled={!stock} className="h-12 flex-1 rounded-btn border border-brand text-16 font-bold text-brand disabled:opacity-40">Add to Cart</button>
            <button onClick={buy} disabled={!stock} className="h-12 flex-1 rounded-btn bg-brand text-16 font-bold text-white disabled:opacity-40">Buy Now</button>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-line p-3">
            <Link href={`/@${shop.handle}`}><Avatar hue={shop.hue} name={shop.name} size={48} /></Link>
            <div className="min-w-0 flex-1">
              <Link href={`/@${shop.handle}`} className="flex items-center gap-1 text-15 font-bold hover:underline"><Store size={14} />{shop.name}{shop.verified && <Verified />}</Link>
              <p className="text-12 text-muted">{shop.rating ? `${shop.rating} shop rating · ` : ''}{fmtCount(shop.followers)} followers</p>
            </div>
            <button onClick={chat} className="flex h-9 items-center gap-1 rounded-btn bg-pill px-3 text-14 font-semibold"><MessageCircle size={15} />Chat</button>
            <Link href={`/@${shop.handle}`} className="hidden h-9 items-center rounded-btn bg-pill px-3 text-14 font-semibold sm:flex">Visit shop</Link>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-18 font-bold">About this product</h2>
        <p className="mt-2 max-w-[760px] text-15 leading-6 text-ink-2">{p.description}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-18 font-bold">Ratings & reviews</h2>
        <div className="mt-3 flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0 text-center sm:w-40">
            <p className="text-[40px] leading-[48px] font-extrabold">{p.rating.toFixed(1)}</p>
            <Stars value={p.rating} size={16} />
            <p className="mt-1 text-13 text-muted">{p.reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {counts.map((c, i) => (
              <button key={i} onClick={() => setStars(stars === 5 - i ? 0 : 5 - i)} className={`flex w-full max-w-[420px] items-center gap-2 rounded-sm px-1 text-13 ${stars === 5 - i ? 'bg-pill' : ''}`}>
                <span className="w-8">{5 - i} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-pill bg-pill"><span className="block h-full bg-gold" style={{ width: `${p.reviews.length ? (c / p.reviews.length) * 100 : 0}%` }} /></span>
                <span className="w-6 text-right text-muted">{c}</span>
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-5 divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.id} className="py-4">
              <p className="flex items-center gap-2 text-14 font-semibold">{r.user}<Stars value={r.stars} /></p>
              <p className="text-12 text-muted">{r.variant && `Variant: ${r.variant} · `}{fmtTime(r.at)}</p>
              <p className="mt-1 text-14">{r.text}</p>
            </li>
          ))}
          {reviews.length === 0 && <li className="py-6 text-14 text-muted">No reviews yet.</li>}
        </ul>
      </section>

      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-18 font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{more.map((x) => <ProductCard key={x.id} product={x} />)}</div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-canvas p-3 md:hidden">
        <button onClick={add} disabled={!stock} className="ml-[72px] h-11 flex-1 rounded-btn border border-brand text-15 font-bold text-brand disabled:opacity-40">Add to Cart</button>
        <button onClick={buy} disabled={!stock} className="h-11 flex-1 rounded-btn bg-brand text-15 font-bold text-white disabled:opacity-40">Buy Now</button>
      </div>
    </div>
  );
}

export default function ProductView({ id }: { id: string }) {
  const { hydrated } = useTikTok();
  const p = useLookup().product(id);
  if (!p) return <div className="p-16 text-center text-muted">{hydrated ? <>This product is not available. <Link href="/shop" className="text-brand">Back to Shop</Link></> : 'Loading…'}</div>;
  return <Detail key={p.id} p={p} />;
}
