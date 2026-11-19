import Link from 'next/link';
import { brand } from '@/config/brand.config';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label={brand.name} className={`flex shrink-0 items-center gap-1.5 ${light ? 'text-white' : 'text-brand'}`}>
      <span className="block h-8 w-8" dangerouslySetInnerHTML={{ __html: brand.logoSvg }} />
      <span className="font-display text-[22px] font-bold tracking-tight">{brand.wordmark}</span>
    </Link>
  );
}
