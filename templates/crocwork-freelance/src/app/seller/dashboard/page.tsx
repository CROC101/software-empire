'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/config/brand.config';
import { categories, getCategory, isCategorySlug } from '@/data/categories';
import { sellers } from '@/data/sellers';
import type { PackageTier, Service, ServicePackage } from '@/lib/types';
import { serviceHref, useStore } from '@/store/useStore';
import { ServiceCard, ServiceCardSkeleton } from '@/components/ServiceCard';
import { Icon } from '@/components/Icon';

const tiers: { tier: PackageTier; title: string; price: string; days: string }[] = [
  { tier: 'basic', title: 'Basic', price: '500', days: '3' },
  { tier: 'standard', title: 'Standard', price: '1200', days: '5' },
  { tier: 'premium', title: 'Premium', price: '2500', days: '7' },
];

const field = 'mt-1 w-full rounded-sm border border-line bg-white p-2.5 text-sm text-ink outline-none focus:border-brand';

export default function SellerDashboardPage() {
  const hydrated = useStore((s) => s.hydrated);
  const userGigs = useStore((s) => s.userGigs);
  const publishGig = useStore((s) => s.publishGig);
  const first = categories[0]!;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(first.slug);
  const [subcategory, setSubcategory] = useState(first.subcategories[0]?.slug ?? '');
  const [description, setDescription] = useState('');
  const [prices, setPrices] = useState(tiers.map((t) => ({ price: t.price, days: t.days })));
  const [published, setPublished] = useState<Service | null>(null);

  const cat = getCategory(category);
  const pricesOk = prices.every((p) => Number(p.price) > 0 && Number(p.days) > 0);
  const ok = title.trim().length >= 10 && description.trim().length >= 20 && pricesOk && isCategorySlug(category);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || !isCategorySlug(category)) return;
    const packages: ServicePackage[] = tiers.map((t, i) => ({
      tier: t.tier,
      title: t.title,
      description: `แพ็กเกจ ${t.title}`,
      price: Math.round(Number(prices[i]!.price)),
      deliveryDays: Math.round(Number(prices[i]!.days)),
      revisions: i === 2 ? 99 : (i + 1) * 2,
      features: [],
    }));
    const gig: Service = {
      id: `u-${Date.now()}`,
      title: title.trim(),
      category,
      subcategory,
      sellerId: sellers[0]!.id,
      motif: Date.now() % 6,
      rating: 0,
      reviewCount: 0,
      sold: 0,
      badges: [],
      description: description.trim(),
      packages,
      faqs: [],
      createdAt: new Date().toISOString(),
      userCreated: true,
    };
    publishGig(gig);
    setPublished(gig);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="container-fw py-8">
      <h1 className="text-2xl font-semibold text-ink">แดชบอร์ดฟรีแลนซ์</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="rounded-lg border border-line p-5">
          <h2 className="flex items-center gap-2 font-semibold text-ink"><Icon name="plus" size={20} className="text-brand" /> สร้างงานบริการใหม่</h2>
          <label className="mt-4 block text-sm text-ink-2">ชื่องาน
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="เช่น ออกแบบโลโก้มินิมอลสำหรับธุรกิจ" className={field} />
            <span className="mt-1 block text-xs text-ink-3">อย่างน้อย 10 ตัวอักษร ({title.trim().length}/80)</span>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-ink-2">หมวดหมู่
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(getCategory(e.target.value)?.subcategories[0]?.slug ?? ''); }} className={field}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm text-ink-2">หมวดหมู่ย่อย
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={field}>
                {cat?.subcategories.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm text-ink-2">รายละเอียดงาน
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="อธิบายสิ่งที่ผู้ว่าจ้างจะได้รับ ขั้นตอนการทำงาน และสิ่งที่ต้องเตรียม" className={field} />
            <span className="mt-1 block text-xs text-ink-3">อย่างน้อย 20 ตัวอักษร</span>
          </label>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-ink">แพ็กเกจราคา</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {tiers.map((t, i) => (
                <div key={t.tier} className="rounded-md border border-line p-3">
                  <p className="text-sm font-semibold text-ink">{t.title}</p>
                  <label className="mt-2 block text-xs text-ink-3">ราคา (บาท)
                    <input type="number" min={1} inputMode="numeric" value={prices[i]!.price} onChange={(e) => setPrices(prices.map((p, j) => (j === i ? { ...p, price: e.target.value } : p)))} className={field} />
                  </label>
                  <label className="mt-2 block text-xs text-ink-3">ระยะเวลา (วัน)
                    <input type="number" min={1} inputMode="numeric" value={prices[i]!.days} onChange={(e) => setPrices(prices.map((p, j) => (j === i ? { ...p, days: e.target.value } : p)))} className={field} />
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={!ok} className="mt-5 w-full rounded-sm bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8">เผยแพร่งาน</button>
          {published && (
            <p className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-brand-tint p-3 text-sm text-ink" role="status">
              <Icon name="check" size={18} className="text-brand" /> เผยแพร่แล้ว เริ่มต้นที่ {formatPrice(published.packages[0]!.price)}
              <Link href={serviceHref(published)} className="font-medium text-brand underline">ดูหน้างาน</Link>
            </p>
          )}
        </form>

        <section>
          <h2 className="font-semibold text-ink">งานของฉัน ({hydrated ? userGigs.length : '…'})</h2>
          {!hydrated ? (
            <div className="mt-4"><ServiceCardSkeleton /></div>
          ) : userGigs.length === 0 ? (
            <p className="mt-4 rounded-md bg-surface p-4 text-sm text-ink-3">ยังไม่มีงานที่เผยแพร่ งานที่สร้างจะแสดงบนหน้าแรกและผลการค้นหาทันที</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-1">{userGigs.map((g) => <ServiceCard key={g.id} service={g} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
