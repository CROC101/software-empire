'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { brand } from '@/config/brand.config';
import { categories, heroWords, trendingKeywords } from '@/data/categories';
import { levelLabel, sellers } from '@/data/sellers';
import { testimonials } from '@/data/services';
import { useAllServices, useStore } from '@/store/useStore';
import { Carousel } from '@/components/Carousel';
import { ServiceCard, ServiceCardSkeleton } from '@/components/ServiceCard';
import { SearchBox } from '@/components/SearchBox';
import { Icon, type IconName } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { CoverArt } from '@/components/CoverArt';

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: 'search', title: 'ค้นหาบริการ', text: 'เลือกฟรีแลนซ์จากผลงาน รีวิว และราคาที่ชัดเจน' },
  { icon: 'chat', title: 'คุยรายละเอียด', text: 'แชทสรุปขอบเขตงาน หรือขอใบเสนอราคาเฉพาะงานคุณ' },
  { icon: 'shield', title: 'ชำระเงินปลอดภัย', text: 'เงินถูกพักไว้กับระบบ ฟรีแลนซ์ยังไม่ได้รับจนกว่าคุณอนุมัติ' },
  { icon: 'check', title: 'อนุมัติงานและรีวิว', text: 'ตรวจงาน ขอแก้ไขได้ตามแพ็กเกจ แล้วจึงปล่อยเงิน' },
];

function useRotating(len: number, ms = 2600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % len), ms);
    return () => clearInterval(t);
  }, [len, ms]);
  return i;
}

export default function HomePage() {
  const hydrated = useStore((s) => s.hydrated);
  const all = useAllServices();
  const wordIdx = useRotating(heroWords.length);

  const popular = useMemo(() => [...all].sort((a, b) => b.sold - a.sold).slice(0, 12), [all]);
  const promo = useMemo(() => all.filter((s) => s.badges.includes('installment') || s.badges.includes('business')).slice(0, 12), [all]);
  const skeletons = Array.from({ length: 6 }, (_, i) => <ServiceCardSkeleton key={i} />);

  return (
    <>
      <section className="hero-bg overflow-hidden">
        <div className="container-fw grid items-center gap-8 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-5xl">
              จ้างฟรีแลนซ์มืออาชีพ
              <br />
              <span className="inline-flex h-[1.25em] overflow-hidden align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span key={wordIdx} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.35 }} className="text-[#ffd84d]">
                    {heroWords[wordIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-white/85">{brand.tagline}</p>
            <div className="mt-6 max-w-xl">
              <SearchBox size="hero" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {trendingKeywords.slice(0, 6).map((k) => (
                <Link key={k} href={`/search/?q=${encodeURIComponent(k)}`} className="rounded-pill border border-white/40 px-3 py-1 text-sm text-white transition hover:bg-white hover:text-brand">
                  {k}
                </Link>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto w-full max-w-[420px]">
            <Image src={brand.mascots.hero} alt="" width={420} height={315} priority className="h-auto w-full" />
          </motion.div>
        </div>
      </section>

      <section className="container-fw -mt-6 relative z-10">
        <div className="no-scrollbar grid grid-flow-col auto-cols-[minmax(132px,1fr)] gap-3 overflow-x-auto rounded-lg bg-white p-3 shadow-panel md:gap-4 md:p-4">
          {categories.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}/`} className="group flex flex-col items-center gap-2 rounded-md p-3 text-center transition hover:bg-brand-tint">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-tint text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon name={c.icon as IconName} size={24} />
              </span>
              <span className="text-sm font-medium leading-snug text-ink">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <Carousel title="บริการยอดนิยม" href="/search/?sort=bestselling">
        {hydrated ? popular.map((s) => <ServiceCard key={s.id} service={s} />) : skeletons}
      </Carousel>

      <Carousel title="ฟรีแลนซ์แนะนำ" itemClass="w-[200px]">
        {sellers.map((s) => {
          const count = all.filter((x) => x.sellerId === s.id).length;
          return (
            <Link key={s.id} href={`/search/?q=${encodeURIComponent(s.name)}`} className="flex w-full flex-col items-center rounded-lg border border-line bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:shadow-lift">
              <Avatar seller={s} size={64} />
              <span className="mt-3 line-clamp-1 font-semibold text-ink">{s.name}</span>
              <span className="mt-1 rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">{levelLabel[s.level]}</span>
              <span className="mt-2 text-xs text-ink-3">{count} บริการ · ตอบกลับ ~{s.responseMinutes} นาที</span>
            </Link>
          );
        })}
      </Carousel>

      <Carousel title="หมวดหมู่มาแรง" itemClass="w-[260px]">
        {categories.flatMap((c) =>
          c.subcategories.slice(0, 2).map((sub, i) => (
            <Link key={`${c.slug}-${sub.slug}`} href={`/categories/${c.slug}/?sub=${sub.slug}`} className="group relative block w-full overflow-hidden rounded-lg shadow-card">
              <CoverArt hue={c.hue} motif={(c.hue + i) % 6} className="aspect-[16/10] w-full transition duration-300 group-hover:scale-[1.03]" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold text-white">{sub.name}</span>
            </Link>
          )),
        )}
      </Carousel>

      <Carousel title="โปรโมชันพิเศษ" href="/search/">
        {hydrated ? promo.map((s) => <ServiceCard key={s.id} service={s} />) : skeletons}
      </Carousel>

      <section className="container-fw py-10">
        <h2 className="text-center text-xl font-semibold text-ink md:text-2xl">จ้างงานง่าย ปลอดภัยทุกขั้นตอน</h2>
        <p className="mt-2 text-center text-sm text-ink-2">ระบบพักเงิน (Escrow) ดูแลเงินของคุณจนกว่างานจะเสร็จ</p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => (
            <li key={st.title} className="rounded-lg border border-line bg-white p-5 shadow-card">
              <span className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white">
                  <Icon name={st.icon} size={22} />
                </span>
                <span className="text-sm font-semibold text-brand">ขั้นตอนที่ {i + 1}</span>
              </span>
              <h3 className="mt-3 font-semibold text-ink">{st.title}</h3>
              <p className="mt-1 text-sm text-ink-2">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface py-10">
        <div className="container-fw">
          <h2 className="text-center text-xl font-semibold text-ink md:text-2xl">เสียงจากผู้ว่าจ้าง</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={t.name} className="rounded-lg bg-white p-6 shadow-card">
                <div className="flex text-star">
                  {Array.from({ length: 5 }, (_, k) => (
                    <Icon key={k} name="star" size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink-2">“{t.text}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <Avatar seller={{ name: t.name, hue: 140 + i * 70 }} size={36} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{t.name}</span>
                    <span className="block text-xs text-ink-3">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fw py-10">
        <div className="grid items-center gap-6 overflow-hidden rounded-lg bg-brand-deep p-6 text-white md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 className="text-xl font-semibold md:text-2xl">ดาวน์โหลดแอป {brand.name}</h2>
            <p className="mt-2 text-sm text-white/80">แชท ติดตามงาน และรับแจ้งเตือนได้ทุกที่ ทุกเวลา</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {['App Store', 'Google Play'].map((s) => (
                <span key={s} className="flex items-center gap-2 rounded-md bg-black/40 px-4 py-2 text-sm font-medium">
                  <Icon name="phone" size={18} /> {s}
                </span>
              ))}
            </div>
          </div>
          <div className="grid h-32 w-32 place-items-center rounded-md bg-white text-ink">
            <Icon name="qr" size={88} />
          </div>
        </div>
      </section>
    </>
  );
}
