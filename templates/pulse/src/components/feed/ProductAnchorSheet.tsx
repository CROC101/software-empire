'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, Truck } from 'lucide-react';
import { Drawer } from '@/components/common/Overlay';
import { ProductArt, Stars } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { baht, fmtCount } from '@/lib/format';
import VariantPicker, { firstPicks, keyOf } from '@/components/shop/VariantPicker';

/** Orange "View Product" pill shown above a shoppable video's caption. */
export function ProductAnchor({ productIds, onOpen }: { productIds: string[]; onOpen: () => void }) {
  const { product } = useLookup();
  const first = product(productIds[0]);
  if (!first) return null;
  return (
    <button onClick={onOpen} className="flex h-7 max-w-full items-center gap-1.5 rounded-sm bg-deal px-2 text-13 font-semibold text-white shadow hover:brightness-105">
      <ShoppingBag size={15} />
      <span className="truncate">View Product • {baht(first.price)}</span>
      {productIds.length > 1 && <span className="rounded-sm bg-white/25 px-1 text-11">+{productIds.length - 1}</span>}
    </button>
  );
}

export default function ProductAnchorSheet({ open, onClose, productIds }: { open: boolean; onClose: () => void; productIds: string[] }) {
  const { product, creator } = useLookup();
  const { addToCart } = useTikTok();
  const { toast } = useUI();
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const p = product(productIds[idx]);
  const [picks, setPicks] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  useEffect(() => { if (p) { setPicks(firstPicks(p)); setQty(1); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;
  const key = keyOf(p, picks);
  const inStock = (p.stock[key] ?? 0) >= qty;
  const shop = creator(p.shopHandle);

  return (
    <Drawer open={open} onClose={onClose} title="Shop this video" width={440}>
      {productIds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-line p-3 no-scrollbar">
          {productIds.map((id, i) => {
            const x = product(id);
            return x ? (
              <button key={id} onClick={() => setIdx(i)} aria-pressed={i === idx} className={`flex shrink-0 items-center gap-2 rounded-md border p-1.5 pr-3 text-13 ${i === idx ? 'border-brand' : 'border-line'}`}>
                <ProductArt hue={x.hue} icon={x.icon} className="h-9 w-9 rounded-sm" />{baht(x.price)}
              </button>
            ) : null;
          })}
        </div>
      )}
      <div className="space-y-4 p-4">
        <div className="flex gap-3">
          <ProductArt hue={p.hue} icon={p.icon} className="h-28 w-28 shrink-0 rounded-md" />
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-16 font-semibold">{p.name}</h3>
            <p className="mt-1 flex items-baseline gap-2"><span className="text-21 font-bold text-brand">{baht(p.price)}</span><s className="text-13 text-muted">{baht(p.originalPrice)}</s></p>
            <p className="mt-1 flex items-center gap-1 text-12 text-muted"><Stars value={p.rating} /> {p.rating} · {fmtCount(p.sold)} sold</p>
            <Link href={`/@${shop.handle}`} onClick={onClose} className="text-12 font-semibold hover:underline">{shop.name}</Link>
          </div>
        </div>
        {p.freeShipping && <p className="flex items-center gap-2 rounded-md bg-[#00b14f]/10 px-3 py-2 text-13 text-[#00a046]"><Truck size={16} />Free shipping · Estimated delivery 2–3 days</p>}
        <VariantPicker product={p} picks={picks} setPicks={setPicks} qty={qty} setQty={setQty} />
        <Link href={`/shop/product/${p.id}`} onClick={onClose} className="block text-14 font-semibold text-brand hover:underline">View full product details</Link>
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-line bg-card p-4">
        <button disabled={!inStock} onClick={() => { addToCart(p.id, key, qty); toast('Added to cart'); onClose(); }} className="h-11 flex-1 rounded-btn border border-brand text-15 font-semibold text-brand disabled:opacity-40">Add to Cart</button>
        <button disabled={!inStock} onClick={() => router.push(`/checkout?buy=${p.id}&v=${encodeURIComponent(key)}&q=${qty}`)} className="h-11 flex-1 rounded-btn bg-brand text-15 font-semibold text-white disabled:opacity-40">Buy Now</button>
      </div>
    </Drawer>
  );
}
