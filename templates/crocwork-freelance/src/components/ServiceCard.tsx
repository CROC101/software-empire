'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { BadgeKey, Service } from '@/lib/types';
import { getCategory } from '@/data/categories';
import { getSeller, levelLabel } from '@/data/sellers';
import { formatPrice } from '@/config/brand.config';
import { serviceHref, useStore } from '@/store/useStore';
import { Avatar } from './Avatar';
import { CoverArt } from './CoverArt';
import { Icon, type IconName } from './Icon';

export const badgeInfo: Record<BadgeKey, { icon: IconName; label: string }> = {
  repeat: { icon: 'repeat', label: 'ลูกค้ากลับมาจ้างซ้ำบ่อย' },
  business: { icon: 'building', label: 'รองรับใบกำกับภาษีสำหรับธุรกิจ' },
  installment: { icon: 'installment', label: 'ผ่อนชำระได้ 0%' },
  expert: { icon: 'medal', label: 'ผู้เชี่ยวชาญที่ผ่านการคัดเลือก' },
  pro: { icon: 'sparkle', label: 'ฟรีแลนซ์ระดับ Pro' },
};

export function HeartButton({ id, className = '' }: { id: string; className?: string }) {
  const fav = useStore((s) => s.favorites.includes(id));
  const toggle = useStore((s) => s.toggleFavorite);
  return (
    <motion.button
      type="button"
      aria-label={fav ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      whileTap={{ scale: 0.8 }}
      className={`grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-card ${fav ? 'text-danger' : 'text-ink-2'} ${className}`}
    >
      <motion.span key={String(fav)} initial={{ scale: fav ? 0.4 : 1 }} animate={{ scale: [fav ? 0.4 : 1, fav ? 1.3 : 1, 1] }} transition={{ duration: 0.35 }} className="grid">
        <Icon name="heart" size={18} fill={fav ? 'currentColor' : 'none'} />
      </motion.span>
    </motion.button>
  );
}

export function ServiceCard({ service, className = '' }: { service: Service; className?: string }) {
  const seller = getSeller(service.sellerId);
  const cat = getCategory(service.category);
  const from = service.packages[0]?.price ?? 0;
  return (
    <Link
      href={serviceHref(service)}
      className={`group relative flex flex-col overflow-hidden rounded-md border border-line-2 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lift ${className}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <CoverArt hue={cat?.hue ?? 220} motif={service.motif} label={service.title} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        <HeartButton id={service.id} className="absolute right-2 top-2" />
        {service.badges.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {service.badges.slice(0, 3).map((b) => (
              <span key={b} tabIndex={0} className="group/badge relative grid h-6 w-6 place-items-center rounded-full bg-white/95 text-brand shadow-card outline-none">
                <Icon name={badgeInfo[b].icon} size={14} />
                <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 mb-1.5 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-2xs text-white opacity-0 transition group-hover/badge:opacity-100 group-focus/badge:opacity-100">
                  {badgeInfo[b].label}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {seller && (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar seller={seller} size={24} />
            <span className="truncate text-xs font-medium text-ink-2">{seller.name}</span>
            <span
              className={`ml-auto shrink-0 rounded-xs px-1.5 py-0.5 text-2xs font-semibold ${
                seller.level === 'pro' ? 'bg-ink text-white' : seller.level === 'top' ? 'bg-[#fff4d6] text-[#9a6700]' : 'bg-brand-soft text-brand'
              }`}
            >
              {levelLabel[seller.level]}
            </span>
          </div>
        )}
        <h3 className="line-clamp-2 min-h-[2.75em] text-sm font-medium leading-snug text-ink">{service.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 text-xs text-ink-3">
          <span className="flex items-center gap-1">
            <Icon name="star" size={14} className="text-star" fill="currentColor" stroke="none" />
            <span className="font-semibold text-ink">{service.rating.toFixed(1)}</span>
            <span>({service.reviewCount})</span>
          </span>
          <span className="text-right">
            เริ่มต้น <span className="font-display text-base font-semibold text-brand">{formatPrice(from)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-line-2 bg-white">
      <div className="skeleton aspect-[16/10]" />
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-3 w-24 rounded-xs" />
        </div>
        <div className="skeleton h-3.5 w-full rounded-xs" />
        <div className="skeleton h-3.5 w-2/3 rounded-xs" />
        <div className="skeleton mt-2 h-4 w-full rounded-xs" />
      </div>
    </div>
  );
}
