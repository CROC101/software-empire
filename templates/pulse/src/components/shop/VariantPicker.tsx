'use client';

import { Minus, Plus } from 'lucide-react';
import type { Product } from '@/types/tiktok';

/** Choice per variant group; returns the stock key "A|B" for the current picks. */
export const keyOf = (p: Product, picks: string[]) => (p.variantGroups.length ? picks.join('|') : '');
export const firstPicks = (p: Product) => {
  // prefer the first combination that is in stock
  const key = Object.keys(p.stock).find((k) => p.stock[k] > 0) ?? Object.keys(p.stock)[0] ?? '';
  return p.variantGroups.length ? key.split('|') : [];
};

export default function VariantPicker({ product, picks, setPicks, qty, setQty }: {
  product: Product; picks: string[]; setPicks: (p: string[]) => void; qty: number; setQty: (n: number) => void;
}) {
  const stock = product.stock[keyOf(product, picks)] ?? 0;
  const optionStock = (gi: number, opt: string) => {
    const next = [...picks];
    next[gi] = opt;
    return product.stock[keyOf(product, next)] ?? 0;
  };
  return (
    <div className="space-y-4">
      {product.variantGroups.map((g, gi) => (
        <fieldset key={g.name}>
          <legend className="mb-2 text-14 font-semibold">{g.name}: <span className="font-normal text-muted">{picks[gi]}</span></legend>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => {
              const n = optionStock(gi, o);
              const on = picks[gi] === o;
              return (
                <button key={o} type="button" aria-pressed={on} onClick={() => { const next = [...picks]; next[gi] = o; setPicks(next); }}
                  className={`h-9 rounded-md border px-3 text-14 ${on ? 'border-brand bg-brand/5 text-brand font-semibold' : 'border-line hover:bg-pill'} ${n === 0 ? 'line-through opacity-50' : ''}`}>
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-4">
        <span className="text-14 font-semibold">Quantity</span>
        <div className="flex items-center rounded-pill border border-line">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center"><Minus size={14} /></button>
          <span className="w-8 text-center text-15" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(Math.max(1, stock), qty + 1))} className="flex h-8 w-8 items-center justify-center"><Plus size={14} /></button>
        </div>
        <span className={`text-13 ${stock < 10 ? 'font-semibold text-deal' : 'text-muted'}`}>{stock === 0 ? 'Out of stock' : `${stock} in stock`}</span>
      </div>
    </div>
  );
}
