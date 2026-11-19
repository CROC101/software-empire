'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { brand, formatPrice } from '@/config/brand.config';
import { getCategory } from '@/data/categories';
import { useService, useStore } from '@/store/useStore';
import { CoverArt } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';

type Method = 'promptpay' | 'card';

// Decorative QR-like grid (not a real payment code).
function FakeQr({ seed }: { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (finder) {
      const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y;
      return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5);
    }
    h = (h * 1103515245 + 12345) >>> 0;
    return (h >> 16) % 2 === 0;
  });
  return (
    <svg viewBox="0 0 21 21" className="h-44 w-44" role="img" aria-label="QR พร้อมเพย์ (ตัวอย่าง)" shapeRendering="crispEdges">
      <rect width="21" height="21" fill="#fff" />
      {cells.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#111" />)}
    </svg>
  );
}

export function CheckoutClient() {
  const router = useRouter();
  const orderId = useSearchParams().get('order') ?? '';
  const hydrated = useStore((s) => s.hydrated);
  const orders = useStore((s) => s.orders);
  const payOrder = useStore((s) => s.payOrder);
  const order = orders.find((o) => o.id === orderId);
  const service = useService(order?.serviceId);
  const [method, setMethod] = useState<Method>('promptpay');
  const [modal, setModal] = useState(false);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });
  const [paying, setPaying] = useState(false);

  if (!hydrated) return <div className="container-fw py-10"><div className="skeleton h-80 w-full max-w-3xl rounded-lg" /></div>;
  if (!order) {
    return (
      <div className="container-fw flex flex-col items-center py-16 text-center">
        <Image src={brand.mascots.empty} alt="" width={200} height={160} />
        <h1 className="mt-4 text-xl font-semibold text-ink">ไม่พบคำสั่งซื้อ</h1>
        <Link href="/orders/" className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">ไปที่งานของฉัน</Link>
      </div>
    );
  }

  const fee = Math.round(order.price * 0.03);
  const total = order.price + fee;
  const paid = order.status !== 'awaiting_payment';
  const digits = card.number.replace(/\D/g, '');
  const cardOk = digits.length === 16 && /^\d{2}\/\d{2}$/.test(card.exp) && /^\d{3,4}$/.test(card.cvc) && card.name.trim().length > 1;

  const confirm = () => {
    if (method === 'card' && !cardOk) return;
    setPaying(true);
    setTimeout(() => {
      payOrder(order.id, method);
      router.push('/orders/');
    }, 900);
  };

  return (
    <div className="container-fw py-8">
      <h1 className="text-2xl font-semibold text-ink">ชำระเงิน</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-line p-5">
          <h2 className="font-semibold text-ink">เลือกวิธีชำระเงิน</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([['promptpay', 'qr', 'พร้อมเพย์ (QR)'], ['card', 'card', 'บัตรเครดิต / เดบิต']] as const).map(([m, icon, label]) => (
              <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m} className={`flex items-center gap-3 rounded-md border-2 p-4 text-left text-sm font-medium transition ${method === m ? 'border-brand bg-brand-tint text-ink' : 'border-line text-ink-2 hover:border-brand/50'}`}>
                <Icon name={icon} size={24} className="text-brand" /> {label}
              </button>
            ))}
          </div>
          <p className="mt-5 flex items-start gap-2 rounded-md bg-surface p-3 text-sm text-ink-2">
            <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brand" />
            เงินของคุณจะถูกพักไว้ที่ {brand.name} และโอนให้ฟรีแลนซ์เมื่อคุณอนุมัติงานแล้วเท่านั้น
          </p>
        </section>

        <aside className="h-fit rounded-lg border border-line p-5 shadow-card">
          <div className="flex gap-3">
            {service && <CoverArt hue={getCategory(service.category)?.hue ?? 220} motif={service.motif} className="aspect-[16/10] w-24 shrink-0 rounded-sm" />}
            <div className="min-w-0 text-sm font-medium text-ink"><span className="line-clamp-3">{order.title}</span></div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-3">ระยะเวลา</dt><dd className="text-ink">{order.deliveryDays} วัน</dd></div>
            <div className="flex justify-between"><dt className="text-ink-3">ค่าบริการ</dt><dd className="text-ink">{formatPrice(order.price)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-3">ค่าธรรมเนียม (3%)</dt><dd className="text-ink">{formatPrice(fee)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt className="text-ink">ยอดรวม</dt><dd className="text-ink">{formatPrice(total)}</dd></div>
          </dl>
          {paid ? (
            <Link href="/orders/" className="mt-5 flex items-center justify-center gap-2 rounded-sm bg-brand-soft py-3 text-sm font-semibold text-brand"><Icon name="check" size={18} /> ชำระแล้ว · ดูงานของฉัน</Link>
          ) : (
            <button type="button" onClick={() => setModal(true)} className="mt-5 w-full rounded-sm bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark">ชำระเงิน {formatPrice(total)}</button>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={() => !paying && setModal(false)}>
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} role="dialog" aria-modal="true" aria-label="ชำระเงิน" className="w-full max-w-sm rounded-lg bg-white p-6 shadow-panel" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">{method === 'promptpay' ? 'สแกนเพื่อชำระด้วยพร้อมเพย์' : 'ชำระด้วยบัตร'}</h2>
                <button type="button" aria-label="ปิด" disabled={paying} onClick={() => setModal(false)}><Icon name="close" /></button>
              </div>
              {method === 'promptpay' ? (
                <div className="mt-4 flex flex-col items-center">
                  <div className="rounded-md border border-line p-3"><FakeQr seed={order.id} /></div>
                  <p className="mt-3 text-lg font-semibold text-ink">{formatPrice(total)}</p>
                  <p className="text-xs text-ink-3">ตัวอย่างเท่านั้น ไม่มีการตัดเงินจริง</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs text-ink-3">หมายเลขบัตร
                    <input inputMode="numeric" autoComplete="off" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} placeholder="4242 4242 4242 4242" className="mt-1 w-full rounded-sm border border-line p-2.5 text-sm text-ink outline-none focus:border-brand" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs text-ink-3">วันหมดอายุ
                      <input value={card.exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} placeholder="MM/YY" className="mt-1 w-full rounded-sm border border-line p-2.5 text-sm text-ink outline-none focus:border-brand" />
                    </label>
                    <label className="block text-xs text-ink-3">CVC
                      <input inputMode="numeric" autoComplete="off" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" className="mt-1 w-full rounded-sm border border-line p-2.5 text-sm text-ink outline-none focus:border-brand" />
                    </label>
                  </div>
                  <label className="block text-xs text-ink-3">ชื่อบนบัตร
                    <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="mt-1 w-full rounded-sm border border-line p-2.5 text-sm text-ink outline-none focus:border-brand" />
                  </label>
                  <p className="text-xs text-ink-3">ตัวอย่างเท่านั้น ข้อมูลบัตรไม่ถูกบันทึกหรือส่งไปที่ใด</p>
                </div>
              )}
              <button type="button" onClick={confirm} disabled={paying || (method === 'card' && !cardOk)} className="mt-5 w-full rounded-sm bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                {paying ? 'กำลังยืนยัน...' : method === 'promptpay' ? 'ฉันชำระเงินแล้ว' : `ชำระ ${formatPrice(total)}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
