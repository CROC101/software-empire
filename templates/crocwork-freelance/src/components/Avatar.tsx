import type { Seller } from '@/lib/types';

export function Avatar({ seller, size = 28 }: { seller: Pick<Seller, 'name' | 'hue'>; size?: number }) {
  const initials = seller.name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, hsl(${seller.hue} 70% 58%), hsl(${seller.hue + 30} 65% 42%))`,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
