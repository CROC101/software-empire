'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Package, Store } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { SCANS } from '@/data/seed-tiktok';
import { baht, fmtTime, ORDER_TAB_LABEL, orderScan, orderTab, variantLabel } from '@/lib/format';
import type { OrderTab } from '@/types/tiktok';

const TABS: OrderTab[] = ['all', 'to_pay', 'to_ship', 'to_receive', 'completed', 'cancelled'];

export default function OrdersPage() {
  const { orders, confirmReceipt, addToCart, markReviewed, hydrated } = useTikTok();
  const { creator } = useLookup();
  const { toast } = useUI();
  const router = useRouter();
  const [tab, setTab] = useState<OrderTab>('all');
  const list = orders.filter((o) => tab === 'all' || orderTab(o) === tab);

  return (
    <div className="mx-auto max-w-[900px] px-4 pb-16 pt-[64px] md:px-8 md:pt-6">
      <h1 className="text-24 font-bold md:pr-[400px]">My Orders & Tracking</h1>
      <div className="sticky top-0 z-10 -mx-4 mt-3 flex gap-1 overflow-x-auto border-b border-line bg-canvas px-4 no-scrollbar md:mx-0 md:px-0" role="tablist">
        {TABS.map((t) => {
          const n = t === 'all' ? 0 : orders.filter((o) => orderTab(o) === t).length;
          return (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative h-11 shrink-0 px-3 text-15 font-semibold ${tab === t ? '' : 'text-muted'}`}>
              {ORDER_TAB_LABEL[t]}{n > 0 && <span className="ml-1 text-12 text-brand">{n}</span>}
              {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-brand" />}
            </button>
          );
        })}
      </div>

      {!hydrated ? <p className="py-16 text-center text-muted">Loading…</p> : list.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted"><Package size={48} /><p className="mt-3">No orders here yet.</p><Link href="/shop" className="mt-3 font-semibold text-brand">Browse the Shop</Link></div>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((o) => {
            const t = orderTab(o);
            const scan = orderScan(o);
            const shop = creator(o.items[0].shopHandle);
            return (
              <li key={o.id} className="rounded-lg border border-line bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3 text-14">
                  <span className="flex items-center gap-1.5 font-semibold"><Store size={15} />{shop.name}</span>
                  <span className={`font-semibold ${t === 'cancelled' ? 'text-muted' : t === 'completed' ? 'text-[#00a87e]' : 'text-brand'}`}>{ORDER_TAB_LABEL[t]}</span>
                </div>
                <Link href={`/orders/${o.id}`} className="block space-y-3 px-4 py-3 hover:bg-pill/50">
                  {o.items.map((i) => (
                    <div key={i.productId + i.variantKey} className="flex gap-3">
                      <ProductArt hue={i.hue} icon={i.icon} className="h-16 w-16 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1 text-14"><p className="line-clamp-1 font-medium">{i.name}</p><p className="text-12 text-muted">{i.variantKey && variantLabel(i.variantKey) + ' · '}×{i.qty}</p></div>
                      <span className="text-14">{baht(i.price * i.qty)}</span>
                    </div>
                  ))}
                  {!o.cancelled && <p className="rounded-md bg-pill px-3 py-2 text-13"><b className="text-[#00a87e]">{SCANS[scan].title}</b> <span className="text-muted">· {fmtTime(o.events[o.events.length - 1].at)}</span></p>}
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
                  <span className="text-13 text-muted">{o.id} · Total <b className="text-16 text-ink">{baht(o.total)}</b></span>
                  <div className="flex flex-wrap gap-2">
                    {!o.cancelled && <Link href={`/orders/${o.id}`} className="h-9 rounded-btn border border-line px-3 text-14 font-semibold leading-9">Track Package</Link>}
                    {t === 'to_receive' && scan >= 6 && <button onClick={() => { confirmReceipt(o.id); toast('Thanks! Order completed'); }} className="h-9 rounded-btn bg-brand px-3 text-14 font-semibold text-white">Confirm Receipt</button>}
                    {(t === 'completed' || t === 'cancelled') && <button onClick={() => { o.items.forEach((i) => addToCart(i.productId, i.variantKey, i.qty)); router.push('/cart'); }} className="h-9 rounded-btn bg-brand px-3 text-14 font-semibold text-white">Buy Again</button>}
                    {t === 'completed' && !o.reviewed && <button onClick={() => { markReviewed(o.id); toast('Review posted · thanks!'); }} className="h-9 rounded-btn border border-brand px-3 text-14 font-semibold text-brand">Write Review</button>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
