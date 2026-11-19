'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { brand, formatPrice } from '@/config/brand.config';
import { categories, getCategory } from '@/data/categories';
import { getSeller } from '@/data/sellers';
import type { CategorySlug, SellerLevel, Service } from '@/lib/types';
import { useAllServices, useStore } from '@/store/useStore';
import { ServiceCard, ServiceCardSkeleton } from './ServiceCard';
import { Icon } from './Icon';

export type SortKey = 'recommended' | 'bestselling' | 'rating' | 'price-asc' | 'price-desc';
const sorts: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'แนะนำ' },
  { key: 'bestselling', label: 'ขายดีที่สุด' },
  { key: 'rating', label: 'คะแนนสูงสุด' },
  { key: 'price-asc', label: 'ราคาต่ำ-สูง' },
  { key: 'price-desc', label: 'ราคาสูง-ต่ำ' },
];
const deliveries: { days: number; label: string }[] = [
  { days: 1, label: 'ภายใน 24 ชม.' },
  { days: 3, label: 'ภายใน 3 วัน' },
  { days: 7, label: 'ภายใน 7 วัน' },
  { days: 0, label: 'ไม่จำกัด' },
];
const tiers: { key: 'all' | Exclude<SellerLevel, 'new'>; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'verified', label: 'Verified' },
  { key: 'top', label: 'Top Rated' },
  { key: 'pro', label: 'Pro' },
];
const pricePresets: { label: string; min: number; max: number }[] = [
  { label: 'ต่ำกว่า ฿1,000', min: 0, max: 1000 },
  { label: '฿1,000 - ฿5,000', min: 1000, max: 5000 },
  { label: '฿5,000 ขึ้นไป', min: 5000, max: 0 },
];
const ratings = [0, 3, 4, 4.5];

const startPrice = (s: Service) => Math.min(...s.packages.map((p) => p.price));
const fastest = (s: Service) => Math.min(...s.packages.map((p) => p.deliveryDays));

export function isSortKey(v: string | null): v is SortKey {
  return sorts.some((s) => s.key === v);
}

export function ListingView({ category, sub, query = '', initialSort = 'recommended' }: { category?: CategorySlug; sub?: string; query?: string; initialSort?: SortKey }) {
  const hydrated = useStore((s) => s.hydrated);
  const all = useAllServices();
  const cat = category ? getCategory(category) : undefined;

  const [subSel, setSub] = useState(sub ?? '');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [days, setDays] = useState(0);
  const [tier, setTier] = useState<(typeof tiers)[number]['key']>('all');
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [panel, setPanel] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lo = Number(minP) || 0;
    const hi = Number(maxP) || 0;
    const list = all.filter((s) => {
      if (category && s.category !== category) return false;
      if (subSel && s.subcategory !== subSel) return false;
      const seller = getSeller(s.sellerId);
      if (q) {
        const hay = `${s.title} ${s.description} ${getCategory(s.category)?.name ?? ''} ${seller?.name ?? ''}`.toLowerCase();
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      const p = startPrice(s);
      if (lo && p < lo) return false;
      if (hi && p > hi) return false;
      if (days && fastest(s) > days) return false;
      if (tier !== 'all' && seller?.level !== tier) return false;
      if (minRating && s.rating < minRating) return false;
      return true;
    });
    const by: Record<SortKey, (a: Service, b: Service) => number> = {
      recommended: (a, b) => b.rating * Math.log(b.reviewCount + 2) - a.rating * Math.log(a.reviewCount + 2),
      bestselling: (a, b) => b.sold - a.sold,
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      'price-asc': (a, b) => startPrice(a) - startPrice(b),
      'price-desc': (a, b) => startPrice(b) - startPrice(a),
    };
    return [...list].sort(by[sort]);
  }, [all, category, subSel, query, minP, maxP, days, tier, minRating, sort]);

  const chips: { label: string; clear: () => void }[] = [];
  const subName = cat?.subcategories.find((x) => x.slug === subSel)?.name;
  if (subName) chips.push({ label: subName, clear: () => setSub('') });
  if (minP || maxP) chips.push({ label: `ราคา ${minP ? formatPrice(Number(minP)) : '฿0'} - ${maxP ? formatPrice(Number(maxP)) : 'ไม่จำกัด'}`, clear: () => { setMinP(''); setMaxP(''); } });
  if (days) chips.push({ label: deliveries.find((d) => d.days === days)?.label ?? '', clear: () => setDays(0) });
  if (tier !== 'all') chips.push({ label: tiers.find((t) => t.key === tier)?.label ?? '', clear: () => setTier('all') });
  if (minRating) chips.push({ label: `${minRating}+ ดาว`, clear: () => setMinRating(0) });
  const clearAll = () => { setSub(''); setMinP(''); setMaxP(''); setDays(0); setTier('all'); setMinRating(0); };

  const radio = (active: boolean) =>
    `rounded-pill border px-3 py-1.5 text-sm transition ${active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-2 hover:border-brand hover:text-brand'}`;

  const filters = (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">งบประมาณ</legend>
        <div className="flex items-center gap-2">
          <input inputMode="numeric" value={minP} onChange={(e) => setMinP(e.target.value.replace(/\D/g, ''))} placeholder="ต่ำสุด" aria-label="ราคาต่ำสุด" className="w-full min-w-0 rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
          <span className="text-ink-3">-</span>
          <input inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value.replace(/\D/g, ''))} placeholder="สูงสุด" aria-label="ราคาสูงสุด" className="w-full min-w-0 rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {pricePresets.map((p) => (
            <button key={p.label} type="button" className={radio(Number(minP || 0) === p.min && Number(maxP || 0) === p.max)} onClick={() => { setMinP(p.min ? String(p.min) : ''); setMaxP(p.max ? String(p.max) : ''); }}>
              {p.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">ระยะเวลาส่งมอบ</legend>
        <div className="flex flex-wrap gap-2">
          {deliveries.map((d) => (
            <button key={d.days} type="button" aria-pressed={days === d.days} className={radio(days === d.days)} onClick={() => setDays(d.days)}>{d.label}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">ระดับฟรีแลนซ์</legend>
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button key={t.key} type="button" aria-pressed={tier === t.key} className={radio(tier === t.key)} onClick={() => setTier(t.key)}>{t.label}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">คะแนนขั้นต่ำ</legend>
        <div className="flex flex-wrap gap-2">
          {ratings.map((r) => (
            <button key={r} type="button" aria-pressed={minRating === r} className={radio(minRating === r)} onClick={() => setMinRating(r)}>
              {r ? <span className="inline-flex items-center gap-1"><Icon name="star" size={14} fill="currentColor" />{r}+</span> : 'ทั้งหมด'}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="container-fw py-6">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
        <Link href="/" className="hover:text-brand">หน้าแรก</Link>
        <Icon name="chevronRight" size={14} />
        {cat ? (
          <>
            <Link href={`/categories/${cat.slug}/`} className={subName ? 'hover:text-brand' : 'text-ink'}>{cat.name}</Link>
            {subName && (<><Icon name="chevronRight" size={14} /><span className="text-ink">{subName}</span></>)}
          </>
        ) : (
          <span className="text-ink">ค้นหา</span>
        )}
      </nav>

      <h1 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
        {cat ? (subName ?? cat.name) : query ? `ผลการค้นหา “${query}”` : 'บริการทั้งหมด'}
      </h1>
      {cat && <p className="mt-1 text-sm text-ink-3">{cat.nameEn}</p>}

      {cat ? (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          <button type="button" className={`shrink-0 ${radio(!subSel)}`} onClick={() => setSub('')}>ทั้งหมด</button>
          {cat.subcategories.map((s) => (
            <button key={s.slug} type="button" className={`shrink-0 ${radio(subSel === s.slug)}`} onClick={() => setSub(s.slug)}>{s.name}</button>
          ))}
        </div>
      ) : (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}/`} className={`shrink-0 ${radio(false)}`}>{c.name}</Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-lg border border-line bg-white p-5">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink-2">{hydrated ? `${results.length.toLocaleString(brand.locale)} บริการ` : 'กำลังโหลด…'}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPanel((v) => !v)} aria-expanded={panel} className="flex items-center gap-1 rounded-pill border border-line px-3 py-1.5 text-sm lg:hidden">
                <Icon name="filter" size={16} /> ตัวกรอง{chips.length ? ` (${chips.length})` : ''}
              </button>
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <span className="hidden sm:inline">เรียงตาม</span>
                <select value={sort} onChange={(e) => isSortKey(e.target.value) && setSort(e.target.value)} className="rounded-sm border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-brand">
                  {sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {panel && <div className="mt-4 rounded-lg border border-line bg-white p-4 lg:hidden">{filters}</div>}

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1 rounded-pill bg-brand-tint px-3 py-1 text-sm text-brand">
                  {c.label}
                  <button type="button" onClick={c.clear} aria-label={`ลบตัวกรอง ${c.label}`} className="rounded-full hover:bg-brand/10"><Icon name="close" size={14} /></button>
                </span>
              ))}
              <button type="button" onClick={clearAll} className="text-sm font-medium text-danger hover:underline">ล้างทั้งหมด</button>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {!hydrated
              ? Array.from({ length: 8 }, (_, i) => <ServiceCardSkeleton key={i} />)
              : results.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>

          {hydrated && results.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center">
              <Image src={brand.mascots.empty} alt="" width={200} height={160} />
              <p className="mt-4 font-semibold text-ink">ไม่พบบริการที่ตรงกับเงื่อนไข</p>
              <p className="mt-1 text-sm text-ink-3">ลองปรับตัวกรองหรือใช้คำค้นหาอื่น</p>
              {chips.length > 0 && <button type="button" onClick={clearAll} className="mt-4 rounded-pill bg-brand px-5 py-2 text-sm font-medium text-white">ล้างตัวกรอง</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
