'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { brand, formatPrice } from '@/config/brand.config';
import { getCategory } from '@/data/categories';
import { getSeller, levelLabel } from '@/data/sellers';
import { useAllServices, useService, useServiceReviews, useStore } from '@/store/useStore';
import { CoverArt } from '@/components/CoverArt';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { HeartButton, ServiceCard, badgeInfo } from '@/components/ServiceCard';
import { Carousel } from '@/components/Carousel';
import type { PackageTier } from '@/lib/types';

const tierName: Record<PackageTier, string> = { basic: 'Basic', standard: 'Standard', premium: 'Premium' };

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="flex text-star" aria-label={`${value} ดาว`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name="star" size={size} fill={i < Math.round(value) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export function ServiceClient({ routeId }: { routeId: string }) {
  const sp = useSearchParams();
  const id = routeId === 'local' ? sp.get('id') : routeId;
  const hydrated = useStore((s) => s.hydrated);
  const service = useService(id);

  if (!service) {
    if (!hydrated) return <div className="container-fw py-10"><div className="skeleton aspect-[16/10] w-full max-w-3xl rounded-lg" /></div>;
    return (
      <div className="container-fw flex flex-col items-center py-16 text-center">
        <Image src={brand.mascots.empty} alt="" width={200} height={160} />
        <h1 className="mt-4 text-xl font-semibold text-ink">ไม่พบบริการนี้</h1>
        <Link href="/search/" className="mt-4 rounded-sm bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">ดูบริการทั้งหมด</Link>
      </div>
    );
  }
  return <ServiceDetail key={service.id} serviceId={service.id} />;
}

function ServiceDetail({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const service = useService(serviceId)!;
  const all = useAllServices();
  const reviews = useServiceReviews(serviceId);
  const ensureConversation = useStore((s) => s.ensureConversation);
  const createOrder = useStore((s) => s.createOrder);
  const seller = getSeller(service.sellerId);
  const cat = getCategory(service.category);
  const sub = cat?.subcategories.find((x) => x.slug === service.subcategory);
  const hue = cat?.hue ?? 220;

  const [shot, setShot] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [tier, setTier] = useState<PackageTier>(service.packages[0]?.tier ?? 'basic');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const pkg = service.packages.find((p) => p.tier === tier) ?? service.packages[0];
  const shots = [0, 1, 2, 3].map((i) => (service.motif + i) % 6);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setShot((v) => (v + 1) % shots.length);
      if (e.key === 'ArrowLeft') setShot((v) => (v + shots.length - 1) % shots.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, shots.length]);

  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { d[5 - r.rating] = (d[5 - r.rating] ?? 0) + 1; });
    return d;
  }, [reviews]);
  const related = useMemo(() => all.filter((s) => s.category === service.category && s.id !== service.id).slice(0, 10), [all, service]);

  const chat = () => {
    const c = ensureConversation(service.id, service.sellerId);
    router.push(`/messages/?c=${c}`);
  };
  const hire = () => {
    if (!pkg) return;
    const o = createOrder({ serviceId: service.id, tier: pkg.tier, title: `${service.title} (${tierName[pkg.tier]})`, price: pkg.price, deliveryDays: pkg.deliveryDays });
    router.push(`/checkout/pay/?order=${o}`);
  };

  return (
    <>
      <div className="container-fw py-6">
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
          <Link href="/" className="hover:text-brand">หน้าแรก</Link>
          {cat && (
            <>
              <Icon name="chevronRight" size={14} />
              <Link href={`/categories/${cat.slug}/`} className="hover:text-brand">{cat.name}</Link>
            </>
          )}
          {cat && sub && (
            <>
              <Icon name="chevronRight" size={14} />
              <Link href={`/categories/${cat.slug}/?sub=${sub.slug}`} className="hover:text-brand">{sub.name}</Link>
            </>
          )}
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-snug text-ink md:text-[28px]">{service.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {seller && <Avatar seller={seller} size={32} />}
              <span className="font-medium text-ink">{seller?.name}</span>
              {seller && <span className="rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">{levelLabel[seller.level]}</span>}
              <span className="flex items-center gap-1 text-ink-2"><Stars value={service.rating} size={14} /> {service.rating.toFixed(1)} ({service.reviewCount})</span>
              <span className="text-ink-3">ขายแล้ว {service.sold} ครั้ง</span>
            </div>

            <div className="mt-5">
              <button type="button" onClick={() => setLightbox(true)} className="group relative block w-full overflow-hidden rounded-lg" aria-label="ดูภาพขนาดใหญ่">
                <CoverArt hue={hue} motif={shots[shot] ?? 0} label={service.title} className="aspect-[16/10] w-full transition duration-300 group-hover:scale-[1.02]" />
                <span className="absolute right-3 top-3"><HeartButton id={service.id} /></span>
              </button>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                {shots.map((m, i) => (
                  <button key={i} type="button" onClick={() => setShot(i)} aria-label={`ภาพที่ ${i + 1}`} className={`w-24 shrink-0 overflow-hidden rounded-sm border-2 transition ${i === shot ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <CoverArt hue={hue} motif={m} className="aspect-[16/10] w-full" />
                  </button>
                ))}
              </div>
            </div>

            {service.badges.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {service.badges.map((b) => (
                  <span key={b} className="flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-xs text-ink-2">
                    <Icon name={badgeInfo[b].icon} size={14} className="text-brand" /> {badgeInfo[b].label}
                  </span>
                ))}
              </div>
            )}

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-ink">รายละเอียดบริการ</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{service.description}</p>
            </section>

            {seller && (
              <section className="mt-8 rounded-lg border border-line p-5">
                <h2 className="text-lg font-semibold text-ink">เกี่ยวกับฟรีแลนซ์</h2>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar seller={seller} size={64} />
                  <div>
                    <div className="font-semibold text-ink">{seller.name}</div>
                    <div className="text-sm text-ink-3">{levelLabel[seller.level]} · {seller.location}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-2">{seller.bio}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-ink-3">ตอบกลับภายใน</dt><dd className="font-medium text-ink">~{seller.responseMinutes} นาที</dd></div>
                  <div><dt className="text-ink-3">เป็นสมาชิกตั้งแต่</dt><dd className="font-medium text-ink">{seller.memberSince}</dd></div>
                  <div><dt className="text-ink-3">ภาษา</dt><dd className="font-medium text-ink">{seller.languages.join(', ')}</dd></div>
                </dl>
                <button type="button" onClick={chat} className="mt-4 flex items-center gap-2 rounded-sm border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft">
                  <Icon name="chat" size={18} /> แชทกับฟรีแลนซ์
                </button>
              </section>
            )}

            {service.faqs.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-ink">คำถามที่พบบ่อย</h2>
                <div className="mt-3 divide-y divide-line rounded-lg border border-line">
                  {service.faqs.map((f, i) => (
                    <div key={f.q}>
                      <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-ink hover:bg-surface">
                        {f.q}
                        <Icon name="chevronDown" size={18} className={`shrink-0 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {openFaq === i && (
                          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 text-sm leading-relaxed text-ink-2">
                            <span className="block pb-4">{f.a}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-ink">รีวิวจากผู้ว่าจ้าง</h2>
              <div className="mt-4 grid gap-6 rounded-lg border border-line p-5 sm:grid-cols-[160px_1fr]">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-bold text-ink">{service.rating.toFixed(1)}</div>
                  <div className="mt-1 flex justify-center sm:justify-start"><Stars value={service.rating} /></div>
                  <div className="mt-1 text-sm text-ink-3">{service.reviewCount} รีวิว</div>
                </div>
                <ul className="space-y-1.5">
                  {dist.map((n, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-ink-2">
                      <span className="w-10 shrink-0">{5 - i} ดาว</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface">
                        <span className="block h-full rounded-pill bg-star" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} />
                      </span>
                      <span className="w-6 shrink-0 text-right">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="mt-4 divide-y divide-line">
                {reviews.length === 0 && <li className="py-4 text-sm text-ink-3">ยังไม่มีรีวิว</li>}
                {reviews.map((r, i) => (
                  <li key={r.id} className="flex gap-3 py-4">
                    <Avatar seller={{ name: r.author, hue: 30 + i * 47 }} size={36} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-ink">{r.author}</span>
                        <Stars value={r.rating} size={13} />
                        <span className="text-xs text-ink-3">{r.date}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{r.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
              <div role="tablist" className="grid grid-cols-3 border-b border-line">
                {service.packages.map((p) => (
                  <button key={p.tier} role="tab" type="button" aria-selected={p.tier === tier} onClick={() => setTier(p.tier)} className={`py-3 text-sm font-medium transition ${p.tier === tier ? 'border-b-2 border-brand text-brand' : 'text-ink-2 hover:text-ink'}`}>
                    {tierName[p.tier]}
                  </button>
                ))}
              </div>
              {pkg && (
                <div className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-ink">{pkg.title}</h3>
                    <span className="text-xl font-bold text-ink">{formatPrice(pkg.price)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-2">{pkg.description}</p>
                  <div className="mt-4 flex gap-4 text-sm text-ink-2">
                    <span className="flex items-center gap-1.5"><Icon name="clock" size={16} /> {pkg.deliveryDays} วัน</span>
                    <span className="flex items-center gap-1.5"><Icon name="repeat" size={16} /> แก้ไข {pkg.revisions} ครั้ง</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-ink-2">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-success" /> {f}</li>
                    ))}
                  </ul>
                  <button type="button" onClick={hire} className="mt-5 w-full rounded-sm bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">จ้างงานเลย ({formatPrice(pkg.price)})</button>
                  <button type="button" onClick={chat} className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-brand py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft">
                    <Icon name="chat" size={18} /> แชทกับฟรีแลนซ์
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-3"><Icon name="shield" size={14} /> ชำระผ่านระบบ เงินถูกพักไว้จนกว่าคุณอนุมัติงาน</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <Carousel title="บริการที่คล้ายกัน" href={cat ? `/categories/${cat.slug}/` : undefined}>
          {related.map((s) => <ServiceCard key={s.id} service={s} />)}
        </Carousel>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="แกลเลอรี" className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setLightbox(false)}>
            <button type="button" aria-label="ปิด" className="absolute right-4 top-4 text-white" onClick={() => setLightbox(false)}><Icon name="close" size={28} /></button>
            <button type="button" aria-label="ภาพก่อนหน้า" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setShot((v) => (v + shots.length - 1) % shots.length); }}><Icon name="chevronLeft" size={28} /></button>
            <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <CoverArt hue={hue} motif={shots[shot] ?? 0} label={service.title} className="aspect-[16/10] w-full rounded-lg" />
              <p className="mt-3 text-center text-sm text-white/80">{shot + 1} / {shots.length}</p>
            </div>
            <button type="button" aria-label="ภาพถัดไป" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setShot((v) => (v + 1) % shots.length); }}><Icon name="chevronRight" size={28} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
