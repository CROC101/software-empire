'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import VoucherList from '@/components/shop/VoucherList';
import { vouchers } from '@/data/seed-tiktok';
import { baht, variantLabel, voucherDiscount } from '@/lib/format';

export default function CartPage() {
  const { cart, products, claimed, selectedVouchers, setQty, toggleCartItem, selectShop, removeCartItem } = useTikTok();
  const { product, creator } = useLookup();
  const lines = cart.map((c) => ({ c, p: product(c.productId) })).filter((l) => l.p);
  const shops = [...new Set(lines.map((l) => l.p!.shopHandle))];
  const chosen = lines.filter((l) => l.c.selected);
  const subtotal = chosen.reduce((a, l) => a + l.p!.price * l.c.qty, 0);
  const discount = voucherDiscount(vouchers.filter((v) => claimed.includes(v.id) && selectedVouchers.includes(v.id)), subtotal, 0);

  if (!lines.length) return (
    <div className="flex flex-col items-center px-4 py-32 text-center">
      <ShoppingCart size={56} className="text-muted-2" />
      <p className="mt-4 text-18 font-bold">Your cart is empty</p>
      <Link href="/shop" className="mt-4 h-10 rounded-btn bg-brand px-6 text-15 font-semibold leading-10 text-white">Go shopping</Link>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 px-4 pb-16 pt-[64px] md:px-8 md:pt-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <h1 className="mb-4 text-24 font-bold md:pr-[400px]">Cart ({cart.length})</h1>
        <div className="space-y-4">
          {shops.map((h) => {
            const mine = lines.filter((l) => l.p!.shopHandle === h);
            const all = mine.every((l) => l.c.selected);
            const s = creator(h);
            return (
              <section key={h} className="rounded-lg border border-line bg-card">
                <label className="flex items-center gap-2 border-b border-line px-4 py-3 text-15 font-semibold">
                  <input type="checkbox" checked={all} onChange={() => selectShop(h, !all, products)} className="h-4 w-4 accent-[#fe2c55]" />
                  <Store size={16} /><Link href={`/@${h}`} className="hover:underline">{s.name}</Link>
                </label>
                <ul className="divide-y divide-line">
                  {mine.map(({ c, p }) => {
                    const max = p!.stock[c.variantKey] ?? 0;
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <input type="checkbox" checked={c.selected} onChange={() => toggleCartItem(c.id)} aria-label={`Select ${p!.name}`} className="h-4 w-4 shrink-0 accent-[#fe2c55]" />
                        <Link href={`/shop/product/${p!.id}`}><ProductArt hue={p!.hue} icon={p!.icon} className="h-20 w-20 shrink-0 rounded-md" /></Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/shop/product/${p!.id}`} className="line-clamp-2 text-14 font-medium hover:underline">{p!.name}</Link>
                          {c.variantKey && <p className="text-12 text-muted">{variantLabel(c.variantKey)}</p>}
                          {c.qty > max && <p className="text-12 text-brand">Only {max} left</p>}
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-16 font-bold text-deal">{baht(p!.price)}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-md border border-line">
                                <button aria-label="Decrease" onClick={() => setQty(c.id, c.qty - 1)} disabled={c.qty <= 1} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><Minus size={14} /></button>
                                <span className="w-8 text-center text-14 font-semibold">{c.qty}</span>
                                <button aria-label="Increase" onClick={() => setQty(c.id, c.qty + 1)} disabled={c.qty >= max} className="flex h-8 w-8 items-center justify-center disabled:opacity-30"><Plus size={14} /></button>
                              </div>
                              <button aria-label="Remove" onClick={() => removeCartItem(c.id)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-pill"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border border-line bg-card p-4 lg:sticky lg:top-6 lg:mt-[52px]">
        <h2 className="text-16 font-bold">Vouchers</h2>
        <VoucherList subtotal={subtotal} />
        <dl className="space-y-1 border-t border-line pt-3 text-14">
          <div className="flex justify-between"><dt className="text-muted">Subtotal ({chosen.length} items)</dt><dd>{baht(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Voucher savings</dt><dd className="text-brand">-{baht(discount)}</dd></div>
          <div className="flex justify-between pt-1 text-17 font-bold"><dt>Total</dt><dd className="text-deal">{baht(Math.max(0, subtotal - discount))}</dd></div>
        </dl>
        <Link href="/checkout" aria-disabled={!chosen.length} className={`block h-11 rounded-btn text-center text-16 font-bold leading-[44px] text-white ${chosen.length ? 'bg-brand' : 'pointer-events-none bg-muted-2'}`}>Check out ({chosen.length})</Link>
      </aside>
    </div>
  );
}
