'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { brand, formatPrice } from '@/config/brand.config';
import { getCategory } from '@/data/categories';
import type { Order, OrderStatus } from '@/lib/types';
import { serviceHref, useService, useStore } from '@/store/useStore';
import { CoverArt } from '@/components/CoverArt';
import { Icon } from '@/components/Icon';

const steps: { key: OrderStatus; label: string }[] = [
  { key: 'awaiting_payment', label: 'รอชำระเงิน' },
  { key: 'in_progress', label: 'กำลังดำเนินการ' },
  { key: 'delivered', label: 'ส่งมอบงาน' },
  { key: 'completed', label: 'อนุมัติงานและรีวิว' },
];

function Tracker({ status }: { status: OrderStatus }) {
  const at = steps.findIndex((s) => s.key === status);
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="สถานะงาน">
      {steps.map((s, i) => {
        const done = i < at || status === 'completed';
        const current = i === at && status !== 'completed';
        return (
          <li key={s.key} className="flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : i <= at ? 'bg-brand' : 'bg-line'}`} />
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? 'bg-brand text-white' : current ? 'border-2 border-brand bg-white text-brand' : 'border-2 border-line bg-white text-ink-3'}`}>
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'invisible' : i < at || status === 'completed' ? 'bg-brand' : 'bg-line'}`} />
            </div>
            <span className={`mt-1.5 text-[11px] leading-tight sm:text-xs ${done || current ? 'text-ink' : 'text-ink-3'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ReviewForm({ orderId }: { orderId: string }) {
  const addReview = useStore((s) => s.addReview);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  return (
    <form
      className="mt-4 rounded-md bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) addReview(orderId, rating, text.trim());
      }}
    >
      <p className="text-sm font-medium text-ink">อนุมัติงานและให้คะแนน</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="คะแนน">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} ดาว`} onClick={() => setRating(n)}>
            <Icon name="star" size={24} className={n <= rating ? 'text-star' : 'text-line-2'} fill="currentColor" />
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="เล่าประสบการณ์การจ้างงานครั้งนี้" aria-label="รีวิว" className="mt-3 w-full rounded-sm border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-brand" />
      <button type="submit" disabled={!text.trim()} className="mt-3 rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">อนุมัติงานและส่งรีวิว</button>
    </form>
  );
}

function OrderCard({ order }: { order: Order }) {
  const service = useService(order.serviceId);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  return (
    <article className="rounded-lg border border-line p-5">
      <div className="flex gap-4">
        {service && (
          <Link href={serviceHref(service)} className="shrink-0">
            <CoverArt hue={getCategory(service.category)?.hue ?? 220} motif={service.motif} className="aspect-[16/10] w-28 rounded-sm" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-ink">{order.title}</p>
          <p className="mt-1 text-xs text-ink-3">#{order.id} · {order.deliveryDays} วัน · {new Date(order.createdAt).toLocaleDateString('th-TH')}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatPrice(order.price)}</p>
        </div>
      </div>
      <Tracker status={order.status} />
      {order.status === 'awaiting_payment' && (
        <Link href={`/checkout/pay/?order=${order.id}`} className="mt-4 inline-flex rounded-sm bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">ชำระเงิน</Link>
      )}
      {order.status === 'in_progress' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm text-ink-2"><Icon name="shield" size={18} className="text-brand" /> เงินถูกพักไว้ที่ {brand.name} จนกว่าคุณจะอนุมัติงาน</p>
          <button type="button" onClick={() => updateOrderStatus(order.id, 'delivered')} className="rounded-sm border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-tint">จำลองการส่งมอบงาน</button>
        </div>
      )}
      {order.status === 'delivered' && <ReviewForm orderId={order.id} />}
      {order.status === 'completed' && (
        <p className="mt-4 flex items-center gap-2 text-sm text-success"><Icon name="check" size={18} /> งานเสร็จสมบูรณ์ ขอบคุณสำหรับรีวิว</p>
      )}
    </article>
  );
}

export default function OrdersPage() {
  const hydrated = useStore((s) => s.hydrated);
  const orders = useStore((s) => s.orders);

  return (
    <div className="container-fw py-8">
      <h1 className="text-2xl font-semibold text-ink">งานของฉัน</h1>
      {!hydrated ? (
        <div className="mt-6 space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-48 rounded-lg" />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Image src={brand.mascots.empty} alt="" width={200} height={160} />
          <p className="mt-4 text-lg font-semibold text-ink">ยังไม่มีงานที่จ้าง</p>
          <Link href="/search/" className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">ค้นหาฟรีแลนซ์</Link>
        </div>
      ) : (
        <div className="mt-6 grid max-w-3xl gap-4">{orders.map((o) => <OrderCard key={o.id} order={o} />)}</div>
      )}
    </div>
  );
}
