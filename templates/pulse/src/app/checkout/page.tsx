'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Banknote, CreditCard, MapPin, QrCode, Truck, Wallet, Zap } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import VoucherList from '@/components/shop/VoucherList';
import { vouchers } from '@/data/seed-tiktok';
import { baht, SHIPPING_FEE, variantLabel, voucherDiscount } from '@/lib/format';
import type { Address, PaymentMethod, ShippingMethod } from '@/types/tiktok';

// shortcut: decorative QR-style pattern, not a scannable PromptPay code; swap in a real QR encoder for live payments
function FakeQR({ seed }: { seed: number }) {
  const n = 25;
  const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && ((x * 7 + y * 13 + seed) * 2654435761) % 7 < 3) cells.push([x, y]);
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="h-44 w-44 rounded-md bg-white" role="img" aria-label="PromptPay QR code">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" />)}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([a, b]) => (
        <g key={`${a}${b}`}><rect x={a + 0.5} y={b + 0.5} width={6} height={6} fill="none" stroke="#000" strokeWidth={1} /><rect x={a + 2} y={b + 2} width={3} height={3} fill="#000" /></g>
      ))}
    </svg>
  );
}

const PAY: { id: PaymentMethod; label: string; icon: typeof QrCode }[] = [
  { id: 'promptpay', label: 'PromptPay QR', icon: QrCode },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
  { id: 'wallet', label: 'Pulse Pay Wallet', icon: Wallet },
];

const field = 'h-11 w-full rounded-md border border-line bg-canvas px-3 text-15 outline-none focus:border-ink';

function Checkout() {
  const sp = useSearchParams();
  const router = useRouter();
  const { cart, claimed, selectedVouchers, placeOrder, hydrated } = useTikTok();
  const { product } = useLookup();
  const buy = sp.get('buy');
  const buyNow = buy ? { productId: buy, variantKey: sp.get('v') ?? '', qty: Math.max(1, Number(sp.get('q')) || 1) } : undefined;
  const lines = (buyNow ? [buyNow] : cart.filter((c) => c.selected)).map((l) => ({ ...l, p: product(l.productId) })).filter((l) => l.p);

  const [addr, setAddr] = useState<Address>({ name: 'Somchai Demo', phone: '0812345678', province: 'Bangkok', district: 'Pathum Wan', postal: '10330', street: '99 Rama I Road, Siam Tower 12F' });
  const [ship, setShip] = useState<ShippingMethod>('standard');
  const [pay, setPay] = useState<PaymentMethod>('promptpay');
  const [card, setCard] = useState({ no: '', exp: '', cvc: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const subtotal = lines.reduce((a, l) => a + l.p!.price * l.qty, 0);
  const fee = SHIPPING_FEE[ship];
  const discount = voucherDiscount(vouchers.filter((v) => claimed.includes(v.id) && selectedVouchers.includes(v.id)), subtotal, fee);
  const total = subtotal + fee - discount;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0\d{8,9}$/.test(addr.phone.replace(/[\s-]/g, ''))) return setErr('Enter a Thai phone number like 0812345678.');
    if (!/^\d{5}$/.test(addr.postal)) return setErr('Postal code must be 5 digits.');
    if (pay === 'card' && (card.no.replace(/\s/g, '').length < 12 || !/^\d{2}\/\d{2}$/.test(card.exp) || !/^\d{3,4}$/.test(card.cvc))) return setErr('Check the card number, expiry (MM/YY) and CVC.');
    setBusy(true);
    const r = placeOrder({ address: addr, shipping: ship, payment: pay, buyNow });
    if (r.error || !r.id) { setBusy(false); return setErr(r.error ?? 'Could not place the order.'); }
    router.push(`/orders/${r.id}?new=1`);
  };

  if (!hydrated) return <div className="p-16 text-center text-muted">Loading…</div>;
  if (!lines.length) return <div className="p-16 text-center text-muted">Nothing to check out. <Link href="/shop" className="text-brand">Go to Shop</Link></div>;

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setAddr({ ...addr, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-[1100px] gap-6 px-4 pb-16 pt-[64px] md:px-8 md:pt-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <h1 className="text-24 font-bold md:pr-[400px]">Checkout</h1>

        <section className="rounded-lg border border-line bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-16 font-bold"><MapPin size={18} className="text-brand" />Shipping address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-13 text-muted">Full name<input required value={addr.name} onChange={set('name')} className={field + ' mt-1 text-ink'} /></label>
            <label className="text-13 text-muted">Phone<input required inputMode="tel" value={addr.phone} onChange={set('phone')} className={field + ' mt-1 text-ink'} /></label>
            <label className="text-13 text-muted">Province<input required value={addr.province} onChange={set('province')} className={field + ' mt-1 text-ink'} /></label>
            <label className="text-13 text-muted">District<input required value={addr.district} onChange={set('district')} className={field + ' mt-1 text-ink'} /></label>
            <label className="text-13 text-muted">Postal code<input required inputMode="numeric" maxLength={5} value={addr.postal} onChange={set('postal')} className={field + ' mt-1 text-ink'} /></label>
            <label className="text-13 text-muted sm:col-span-2">Street address<input required value={addr.street} onChange={set('street')} className={field + ' mt-1 text-ink'} /></label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-card p-4">
          <h2 className="mb-3 text-16 font-bold">Shipping option</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([['standard', 'Standard Express', 'Flash Express · 2–3 days', Truck], ['sameday', 'Same-Day Priority', 'Kerry Express · today before 21:00', Zap]] as const).map(([id, t, d, Icon]) => (
              <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${ship === id ? 'border-brand bg-brand/5' : 'border-line'}`}>
                <input type="radio" name="ship" checked={ship === id} onChange={() => setShip(id)} className="accent-[#fe2c55]" />
                <Icon size={20} className="shrink-0" />
                <span className="min-w-0 flex-1"><span className="block text-14 font-semibold">{t}</span><span className="text-12 text-muted">{d}</span></span>
                <span className="text-14 font-bold">{SHIPPING_FEE[id] ? baht(SHIPPING_FEE[id]) : 'Free'}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-card p-4">
          <h2 className="mb-3 text-16 font-bold">Payment method</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {PAY.map(({ id, label, icon: Icon }) => (
              <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-14 font-semibold ${pay === id ? 'border-brand bg-brand/5' : 'border-line'}`}>
                <input type="radio" name="pay" checked={pay === id} onChange={() => setPay(id)} className="accent-[#fe2c55]" /><Icon size={18} />{label}
              </label>
            ))}
          </div>
          {pay === 'promptpay' && (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-md bg-pill p-4 sm:flex-row sm:gap-5">
              <FakeQR seed={total} />
              <div className="text-center sm:text-left"><p className="text-14 font-bold">Scan with any Thai banking app</p><p className="text-22 font-extrabold text-deal">{baht(total)}</p><p className="text-12 text-muted">Demo QR: placing the order marks it paid.</p></div>
            </div>
          )}
          {pay === 'card' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <input placeholder="Card number" inputMode="numeric" value={card.no} onChange={(e) => setCard({ ...card, no: e.target.value })} aria-label="Card number" className={field + ' col-span-2'} />
              <input placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} aria-label="Expiry" className={field} />
              <input placeholder="CVC" inputMode="numeric" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} aria-label="CVC" className={field} />
            </div>
          )}
          {pay === 'cod' && <p className="mt-3 text-13 text-muted">Pay the courier in cash when the parcel arrives.</p>}
          {pay === 'wallet' && <p className="mt-3 text-13 text-muted">Paid from your Pulse Pay balance (demo balance covers any order).</p>}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border border-line bg-card p-4 lg:sticky lg:top-6 lg:mt-[52px]">
        <h2 className="text-16 font-bold">Order summary</h2>
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.productId + l.variantKey} className="flex gap-3">
              <ProductArt hue={l.p!.hue} icon={l.p!.icon} className="h-14 w-14 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 text-13"><p className="line-clamp-2 font-medium">{l.p!.name}</p><p className="text-muted">{l.variantKey && variantLabel(l.variantKey) + ' · '}×{l.qty}</p></div>
              <span className="text-14 font-semibold">{baht(l.p!.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <VoucherList subtotal={subtotal} />
        <dl className="space-y-1 border-t border-line pt-3 text-14">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{baht(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{fee ? baht(fee) : 'Free'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Vouchers</dt><dd className="text-brand">-{baht(discount)}</dd></div>
          <div className="flex justify-between pt-1 text-18 font-bold"><dt>Total</dt><dd className="text-deal">{baht(total)}</dd></div>
        </dl>
        {err && <p role="alert" className="rounded-md bg-brand/10 p-2 text-13 text-brand">{err}</p>}
        <button type="submit" disabled={busy} className="h-12 w-full rounded-btn bg-brand text-16 font-bold text-white disabled:opacity-50">Place Order</button>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="p-16 text-center text-muted">Loading…</div>}><Checkout /></Suspense>;
}
