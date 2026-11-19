'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/common/Overlay';
import { ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { baht, variantLabel } from '@/lib/format';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, setQty, toggleCartItem, removeCartItem } = useTikTok();
  const { product } = useLookup();
  const lines = cart.map((c) => ({ c, p: product(c.productId) })).filter((x) => x.p);
  const subtotal = lines.reduce((a, { c, p }) => a + (c.selected ? p!.price * c.qty : 0), 0);
  const count = lines.reduce((a, { c }) => a + (c.selected ? c.qty : 0), 0);

  return (
    <Drawer open={open} onClose={onClose} title={`Shopping cart (${cart.length})`}>
      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-muted">
          <ShoppingCart size={48} />
          <p className="text-15">Your cart is empty</p>
          <Link href="/shop" onClick={onClose} className="rounded-btn bg-brand px-6 py-2 text-15 font-semibold text-white">Go shopping</Link>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          <ul className="flex-1 divide-y divide-line">
            {lines.map(({ c, p }) => (
              <li key={c.id} className="flex gap-3 p-4">
                <input type="checkbox" checked={c.selected} onChange={() => toggleCartItem(c.id)} aria-label={`Select ${p!.name}`} className="mt-7 h-4 w-4 accent-brand" />
                <Link href={`/shop/product/${p!.id}`} onClick={onClose}><ProductArt hue={p!.hue} icon={p!.icon} className="h-[72px] w-[72px] rounded-md" /></Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/shop/product/${p!.id}`} onClick={onClose} className="line-clamp-2 text-14 font-medium hover:underline">{p!.name}</Link>
                  {c.variantKey && <p className="text-12 text-muted">{variantLabel(c.variantKey)}</p>}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-15 font-bold text-brand">{baht(p!.price)}</span>
                    <div className="flex items-center rounded-pill border border-line">
                      <button aria-label="Decrease" onClick={() => setQty(c.id, c.qty - 1)} className="flex h-7 w-7 items-center justify-center"><Minus size={14} /></button>
                      <span className="w-6 text-center text-14">{c.qty}</span>
                      <button aria-label="Increase" onClick={() => setQty(c.id, c.qty + 1)} className="flex h-7 w-7 items-center justify-center"><Plus size={14} /></button>
                    </div>
                    <button aria-label="Remove" onClick={() => removeCartItem(c.id)} className="text-muted hover:text-brand"><Trash2 size={16} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-0 border-t border-line bg-card p-4">
            <div className="mb-3 flex justify-between text-15"><span>Subtotal ({count} items)</span><b>{baht(subtotal)}</b></div>
            <div className="flex gap-2">
              <Link href="/cart" onClick={onClose} className="flex h-11 flex-1 items-center justify-center rounded-btn bg-pill text-15 font-semibold hover:bg-pill-hover">View cart</Link>
              <Link href="/checkout" onClick={onClose} className={`flex h-11 flex-1 items-center justify-center rounded-btn bg-brand text-15 font-semibold text-white ${count === 0 ? 'pointer-events-none opacity-50' : ''}`}>Checkout</Link>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
