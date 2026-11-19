'use client';

import {
  Backpack, Box, Cable, Camera, Headphones, Keyboard, Lamp, Mic, Mouse, Plug, Shirt, Speaker, Watch, BadgeCheck, Star,
  type LucideIcon,
} from 'lucide-react';
import type { Hue, ProductIcon } from '@/types/tiktok';

/** Original two-tone logo mark (a rounded play-pulse glyph), not the real brand. */
export function LogoMark({ size = 28 }: { size?: number }) {
  // shortcut: placeholder mark until the person supplies their own logo
  const path = 'M8 5.8c0-1.4 1.5-2.2 2.7-1.5l9.4 5.6c1.2.7 1.2 2.4 0 3.1l-9.4 5.6C9.5 19.3 8 18.4 8 17z';
  return (
    <svg width={size} height={size} viewBox="0 0 26 24" fill="none" aria-hidden>
      <path d={path} fill="#25f4ee" transform="translate(-2,0)" />
      <path d={path} fill="#fe2c55" transform="translate(2,1)" />
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-ink">
      <LogoMark size={28} />
      {!compact && <span className="font-display text-[26px] leading-7 font-extrabold tracking-[-0.5px]">Pulse</span>}
    </span>
  );
}

/** Gradient artwork used as video posters, drama covers and thumbnails. */
export function Art({ hue, label, className = '', seed = 0 }: { hue: Hue; label?: string; className?: string; seed?: number }) {
  const id = `g${hue[0].slice(1)}${hue[1].slice(1)}${seed}`;
  return (
    <svg className={className} viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hue[0]} />
          <stop offset="1" stopColor={hue[1]} />
        </linearGradient>
      </defs>
      <rect width="90" height="160" fill={`url(#${id})`} />
      <circle cx={20 + (seed * 17) % 50} cy={40 + (seed * 23) % 60} r="34" fill="#fff" opacity=".08" />
      <circle cx={70 - (seed * 11) % 40} cy={120 - (seed * 13) % 40} r="22" fill="#000" opacity=".15" />
      <path d={`M0 ${110 + (seed % 5) * 6} Q45 ${90 + (seed % 7) * 4} 90 ${118 + (seed % 3) * 5} V160 H0Z`} fill="#000" opacity=".22" />
      {label && (
        <text x="45" y="80" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" opacity=".9" style={{ fontFamily: 'var(--font-sans)' }}>
          {label}
        </text>
      )}
    </svg>
  );
}

const ICONS: Record<ProductIcon, LucideIcon> = {
  keyboard: Keyboard, lamp: Lamp, headphones: Headphones, shirt: Shirt, plug: Plug, mouse: Mouse, watch: Watch,
  speaker: Speaker, backpack: Backpack, camera: Camera, cable: Cable, mic: Mic, box: Box,
};

/** Product picture: gradient tile with the product's icon. `angle` varies the gallery views. */
export function ProductArt({ hue, icon, className = '', angle = 0 }: { hue: Hue; icon: ProductIcon; className?: string; angle?: number }) {
  const Icon = ICONS[icon];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(${135 + angle * 40}deg, ${hue[0]}, ${hue[1]})` }}
    >
      <div className="absolute -top-1/4 -right-1/4 h-3/4 w-3/4 rounded-full bg-white/10" />
      <Icon className="relative h-1/2 w-1/2 text-white drop-shadow-lg" strokeWidth={1.4} style={{ transform: `rotate(${angle * -8}deg) scale(${1 - angle * 0.08})` }} />
    </div>
  );
}

export function Avatar({ hue, name, size = 40, className = '' }: { hue: Hue; name: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})` }}
      aria-hidden
    >
      {name.replace(/[^\p{L}\d]/gu, '').slice(0, 1).toUpperCase() || '?'}
    </span>
  );
}

export function Verified({ size = 14 }: { size?: number }) {
  return <BadgeCheck aria-label="Verified" width={size} height={size} className="inline shrink-0 fill-verified text-white" />;
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-px" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? 'fill-gold text-gold' : 'text-muted'} />
      ))}
    </span>
  );
}
