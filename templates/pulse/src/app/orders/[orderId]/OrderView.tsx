'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Copy, MapPin, Phone, ScanLine, Truck, User } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import LogisticsTimeline from '@/components/shop/LogisticsTimeline';
import { SCANS } from '@/data/seed-tiktok';
import { baht, fmtTime, ORDER_TAB_LABEL, orderScan, orderTab, variantLabel } from '@/lib/format';

const PAY_LABEL = { promptpay: 'PromptPay QR', card: 'Card', cod: 'Cash on Delivery', wallet: 'Pulse Pay Wallet' };

export default function OrderView({ id }: { id: string }) {
  const { orders, hydrated, advanceOrder, confirmReceipt, cancelOrder } = useTikTok();
  const { toast } = useUI();
  const [fresh] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new'));
  const o = orders.find((x) => x.id === id);
  if (!o) return <div className="p-16 text-center text-muted">{hydrated ? <>Order {id} was not found. <Link href="/orders" className="text-brand">My orders</Link></> : 'Loading…'}</div>;

  const scan = orderScan(o);
  const last = SCANS.length - 1;
  const pct = Math.round((scan / last) * 100);
  const courier = o.carrier.startsWith('Kerry') ? { name: 'Anan K.', phone: '089-555-0142' } : { name: 'Wichai P.', phone: '086-555-0177' };
  const t = orderTab(o);

  return (
    <div className="mx-auto max-w-[900px] space-y-4 px-4 pb-16 pt-[64px] md:px-8 md:pt-6">
      <Link href="/orders" className="text-14 text-muted hover:underline">← My orders</Link>
      {fresh && <p className="flex items-center gap-2 rounded-lg bg-[#00a87e]/10 p-3 text-14 font-semibold text-[#00a87e]"><CheckCircle2 size={18} />Order placed! Stock reserved and tracking created.</p>}
      <div className="flex flex-wrap items-end justify-between gap-2 md:pr-[400px]">
        <div><h1 className="text-22 font-bold">Order {o.id}</h1><p className="text-13 text-muted">Placed {fmtTime(o.createdAt)} · {ORDER_TAB_LABEL[t]}</p></div>
      </div>

      <section className="rounded-lg border border-line bg-card p-4">
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-14">
          <span className="flex items-center gap-1 font-semibold"><Truck size={16} />{o.carrier}</span>
          <button onClick={() => { navigator.clipboard?.writeText(o.tracking).catch(() => {}); toast('Tracking number copied'); }} className="flex items-center gap-1 font-mono text-muted hover:text-ink">{o.tracking}<Copy size={13} /></button>
        </div>
        {o.cancelled ? <p className="text-14 text-muted">This order was cancelled and the stock returned to the shop.</p> : <LogisticsTimeline order={o} />}
      </section>

      {!o.cancelled && (
        <section className="rounded-lg border border-line bg-card p-4">
          <div className="flex items-center justify-between text-13"><span className="font-semibold">Live GPS · {SCANS[scan].location}</span><span className="text-muted">{pct}%</span></div>
          <div className="relative mt-3 h-2 rounded-pill bg-pill">
            <span className="absolute inset-y-0 left-0 rounded-pill bg-gradient-to-r from-cyan to-[#00a87e] transition-all duration-700" style={{ width: `${pct}%` }} />
            <Truck size={20} className="absolute -top-[7px] text-[#00a87e] transition-all duration-700" style={{ left: `calc(${pct}% - 10px)` }} />
          </div>
          <div className="mt-2 flex justify-between text-11 text-muted"><span>Seller warehouse</span><span>{o.address.district}</span></div>
          {scan >= 3 && (
            <div className="mt-4 flex items-center gap-3 rounded-md bg-pill p-3 text-14">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card"><User size={18} /></span>
              <span className="flex-1"><b>{courier.name}</b><span className="block text-12 text-muted">{o.carrier} courier</span></span>
              <a href={`tel:${courier.phone}`} className="flex items-center gap-1 text-13 font-semibold text-brand"><Phone size={14} />{courier.phone}</a>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {scan < last && <button onClick={() => advanceOrder(o.id)} className="flex h-10 items-center gap-2 rounded-btn bg-ink px-4 text-14 font-semibold text-canvas"><ScanLine size={16} />Simulate Next Logistics Scan</button>}
            {scan >= 6 && !o.received && <button onClick={() => { confirmReceipt(o.id); toast('Order completed. Thanks!'); }} className="h-10 rounded-btn bg-brand px-4 text-14 font-semibold text-white">Confirm Order Received</button>}
            {scan < 2 && <button onClick={() => { cancelOrder(o.id); toast('Order cancelled'); }} className="h-10 rounded-btn border border-line px-4 text-14 font-semibold">Cancel order</button>}
            {o.received && <span className="flex items-center gap-1 text-14 font-semibold text-[#00a87e]"><CheckCircle2 size={16} />Received</span>}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-card p-4 text-14">
          <h2 className="mb-2 flex items-center gap-1 font-bold"><MapPin size={16} className="text-brand" />Deliver to</h2>
          <p className="font-semibold">{o.address.name} · {o.address.phone}</p>
          <p className="text-muted">{o.address.street}, {o.address.district}, {o.address.province} {o.address.postal}</p>
        </div>
        <div className="rounded-lg border border-line bg-card p-4 text-14">
          <h2 className="mb-2 font-bold">Payment</h2>
          <dl className="space-y-1">
            <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{PAY_LABEL[o.payment]}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{baht(o.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping ({o.shipping === 'sameday' ? 'Same-Day' : 'Standard'})</dt><dd>{o.shippingFee ? baht(o.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Vouchers</dt><dd className="text-brand">-{baht(o.discount)}</dd></div>
            <div className="flex justify-between text-16 font-bold"><dt>Total</dt><dd className="text-deal">{baht(o.total)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-card p-4">
        <h2 className="mb-3 text-15 font-bold">Items</h2>
        <ul className="space-y-3">
          {o.items.map((i) => (
            <li key={i.productId + i.variantKey}>
              <Link href={`/shop/product/${i.productId}`} className="flex gap-3">
                <ProductArt hue={i.hue} icon={i.icon} className="h-16 w-16 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1 text-14"><span className="line-clamp-1 font-medium">{i.name}</span><span className="text-12 text-muted">{i.variantKey && variantLabel(i.variantKey) + ' · '}×{i.qty}</span></span>
                <span className="text-14">{baht(i.price * i.qty)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
