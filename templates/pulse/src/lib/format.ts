import type { Order, OrderTab, Product, Voucher } from '@/types/tiktok';

export function fmtCount(n: number): string {
  if (n >= 1e9) return trim(n / 1e9) + 'B';
  if (n >= 1e6) return trim(n / 1e6) + 'M';
  if (n >= 1e4) return trim(n / 1e3) + 'K';
  return String(n);
}
const trim = (x: number) => (Math.round(x * 10) / 10).toString();

export const baht = (n: number) => '฿' + n.toLocaleString('en-US');

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
}

export const variantLabel = (key: string) => key.split('|').join(' / ');

export function totalStock(p: Product): number {
  return Object.values(p.stock).reduce((a, b) => a + b, 0);
}

export function orderStage(o: Order): number {
  return o.events[o.events.length - 1]?.stage ?? 0;
}
export function orderScan(o: Order): number {
  return o.events[o.events.length - 1]?.scan ?? 0;
}

export function orderTab(o: Order): Exclude<OrderTab, 'all'> {
  if (o.cancelled) return 'cancelled';
  if (o.received) return 'completed';
  if (orderScan(o) < 2) return 'to_ship';
  return 'to_receive';
}

export const ORDER_TAB_LABEL: Record<OrderTab, string> = {
  all: 'All', to_pay: 'To Pay', to_ship: 'To Ship', to_receive: 'To Receive', completed: 'Completed', cancelled: 'Cancelled',
};

export const SHIPPING_FEE = { standard: 0, sameday: 45 } as const;

/** Discount from claimed vouchers on a subtotal + shipping fee. */
export function voucherDiscount(vs: Voucher[], subtotal: number, shippingFee: number): number {
  let d = 0;
  for (const v of vs) {
    if (subtotal < v.minSpend || subtotal === 0) continue;
    if (v.kind === 'amount') d += v.value;
    if (v.kind === 'shipping') d += Math.min(v.value, shippingFee);
    if (v.kind === 'percent') d += Math.min(Math.round((subtotal * v.value) / 100), v.cap ?? Infinity);
  }
  return Math.min(d, subtotal + shippingFee);
}
