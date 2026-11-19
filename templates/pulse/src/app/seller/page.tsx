'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Minus, PackageCheck, Plus, Printer, Star, Trash2, Truck } from 'lucide-react';
import { ProductArt } from '@/components/common/Visuals';
import { Modal } from '@/components/common/Overlay';
import { useTikTok } from '@/context/TikTokContext';
import { useUI } from '@/components/layout/ui';
import { baht, fmtTime, orderScan, totalStock, variantLabel } from '@/lib/format';
import type { Product, VariantGroup } from '@/types/tiktok';

const CATS: Product['category'][] = ['Electronics', 'Keyboards & Gear', 'Apparel', 'Audio', 'Accessories'];
const field = 'mt-1 h-10 w-full rounded-md border border-line bg-canvas px-3 text-15 text-ink outline-none focus:border-ink';

function AddProduct({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProduct } = useTikTok();
  const { toast } = useUI();
  const [f, setF] = useState({ name: '', price: '', stock: '', category: CATS[0] as Product['category'], description: '' });
  const [groups, setGroups] = useState<{ name: string; options: string }[]>([]);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(f.price), stock = Number(f.stock);
    if (!f.name.trim() || !(price > 0) || !Number.isInteger(stock) || stock < 0) return setErr('Enter a name, a price above 0 and a whole-number stock.');
    const gs: VariantGroup[] = groups.map((g) => ({ name: g.name.trim(), options: g.options.split(',').map((o) => o.trim()).filter(Boolean) })).filter((g) => g.name && g.options.length);
    const id = addProduct({ name: f.name.trim(), price, stock, category: f.category, groups: gs, description: f.description.trim() || 'New arrival from our shop.' });
    if (!id) return setErr('Demo product limit reached (30 new products).');
    toast('Product published to the Shop');
    setF({ name: '', price: '', stock: '', category: CATS[0], description: '' }); setGroups([]); setErr(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Add New Product" width={520}>
      <form onSubmit={submit} className="space-y-3 px-5 pb-5 text-13 text-muted">
        <label className="block">Product name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} required /></label>
        <div className="grid grid-cols-3 gap-3">
          <label>Price (฿)<input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={field} required /></label>
          <label>Stock{groups.length > 0 && ' / option'}<input inputMode="numeric" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} className={field} required /></label>
          <label>Category<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Product['category'] })} className={field}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <label className="block">Description<textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className={field + ' h-auto py-2'} /></label>
        <div>
          <p className="mb-1">Variants (optional)</p>
          {groups.map((g, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input placeholder="e.g. Color" value={g.name} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Variant name" className={field + ' mt-0 w-1/3'} />
              <input placeholder="Black, White, Pink" value={g.options} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, options: e.target.value } : x)))} aria-label="Options, comma separated" className={field + ' mt-0 flex-1'} />
              <button type="button" aria-label="Remove variant" onClick={() => setGroups(groups.filter((_, j) => j !== i))} className="px-2 text-muted"><Trash2 size={16} /></button>
            </div>
          ))}
          {groups.length < 2 && <button type="button" onClick={() => setGroups([...groups, { name: '', options: '' }])} className="flex h-8 items-center gap-1 rounded-btn bg-pill px-3 text-13 font-semibold text-ink"><Plus size={14} />Add variant group</button>}
        </div>
        {err && <p role="alert" className="text-brand">{err}</p>}
        <button className="h-11 w-full rounded-btn bg-brand text-15 font-bold text-white">Publish product</button>
      </form>
    </Modal>
  );
}

export default function SellerPage() {
  const { orders, products, advanceOrder, setStock, hydrated } = useTikTok();
  const { toast } = useUI();
  const [adding, setAdding] = useState(false);
  const live = orders.filter((o) => !o.cancelled);
  const queue = live.filter((o) => orderScan(o) < 2);
  const gmv = live.reduce((a, o) => a + o.total, 0);
  const pending = live.filter((o) => !o.received).reduce((a, o) => a + o.total, 0);
  const rated = products.filter((p) => p.reviews.length);
  const rating = rated.length ? rated.reduce((a, p) => a + p.rating, 0) / rated.length : 0;

  const kpis = [
    ['GMV (all time)', baht(gmv)],
    ['Orders to Ship', String(queue.length)],
    ['Pending Revenue', baht(pending)],
    ['Shop Rating', rating.toFixed(1) + ' ★'],
  ];

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 pb-16 pt-[64px] md:px-8 md:pt-6">
      <div className="md:pr-[400px]"><h1 className="text-24 font-bold">Seller Center</h1><p className="text-14 text-muted">Pack orders, hand them to couriers and manage stock.</p></div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-card p-4"><p className="text-13 text-muted">{k}</p><p className="mt-1 text-22 font-extrabold">{hydrated ? v : '…'}</p></div>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-card">
        <h2 className="border-b border-line px-4 py-3 text-16 font-bold">Fulfillment queue</h2>
        {queue.length === 0 ? <p className="px-4 py-8 text-center text-14 text-muted">All caught up. New orders appear here.</p> : (
          <ul className="divide-y divide-line">
            {queue.map((o) => {
              const scan = orderScan(o);
              return (
                <li key={o.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 text-14">
                    <p className="font-semibold"><Link href={`/orders/${o.id}`} className="hover:underline">{o.id}</Link> · {o.address.name} · {o.address.province}</p>
                    <p className="truncate text-13 text-muted">{o.items.map((i) => `${i.name}${i.variantKey ? ` (${variantLabel(i.variantKey)})` : ''} ×${i.qty}`).join(', ')}</p>
                    <p className="text-12 text-muted">{o.carrier} · {o.tracking} · {fmtTime(o.createdAt)}</p>
                  </div>
                  {scan === 0
                    ? <button onClick={() => { advanceOrder(o.id, 1); toast('Label printed · parcel packed'); }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-btn bg-ink px-3 text-14 font-semibold text-canvas"><Printer size={15} />Print Shipping Label & Pack</button>
                    : <button onClick={() => { advanceOrder(o.id, 2); toast('Handed to courier · buyer tracking updated'); }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-btn bg-brand px-3 text-14 font-semibold text-white"><Truck size={15} />Hand Over to Courier</button>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-16 font-bold">Inventory ({products.length})</h2>
          <button onClick={() => setAdding(true)} className="flex h-9 items-center gap-1 rounded-btn bg-brand px-3 text-14 font-semibold text-white"><Plus size={15} />Add New Product</button>
        </div>
        <ul className="divide-y divide-line">
          {products.map((p) => {
            const keys = Object.keys(p.stock);
            const total = totalStock(p);
            return (
              <li key={p.id} className="flex gap-3 px-4 py-3">
                <ProductArt hue={p.hue} icon={p.icon} className="h-14 w-14 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <Link href={`/shop/product/${p.id}`} className="line-clamp-1 text-14 font-semibold hover:underline">{p.name}</Link>
                  <p className="text-12 text-muted">{p.category} · {baht(p.price)} · {p.sold} sold · <span className={total < 10 ? 'font-semibold text-brand' : ''}>{total} in stock</span> {p.reviews.length > 0 && <><Star size={11} className="inline fill-gold text-gold" /> {p.rating.toFixed(1)}</>}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {keys.map((k) => (
                      <span key={k} className="flex items-center gap-1 rounded-md bg-pill py-0.5 pl-2 pr-0.5 text-12">
                        {k ? variantLabel(k) : 'Stock'}
                        <button aria-label={`Less ${k}`} onClick={() => setStock(p.id, k, Math.max(0, p.stock[k] - 1))} className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-pill-hover"><Minus size={12} /></button>
                        <b className="w-6 text-center">{p.stock[k]}</b>
                        <button aria-label={`More ${k}`} onClick={() => setStock(p.id, k, p.stock[k] + 1)} className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-pill-hover"><Plus size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
                {total === 0 && <span className="h-fit shrink-0 rounded-sm bg-brand/10 px-1.5 text-12 font-semibold text-brand">Sold out</span>}
              </li>
            );
          })}
        </ul>
      </section>
      <p className="flex items-center gap-1 text-12 text-muted"><PackageCheck size={14} />Changes show up instantly in the Shop, buyer tracking and the Upload product picker.</p>
      <AddProduct open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
