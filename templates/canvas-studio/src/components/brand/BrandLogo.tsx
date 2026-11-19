import Link from 'next/link';

/** Gradient emblem + wordmark with hover shimmer and PRO pill. */
export function BrandLogo({ compact = false, href = '/' }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label="CanvaCraft Pro home" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl py-1 pr-1">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden className="shrink-0 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
        <defs>
          <linearGradient id="bl-emblem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00C4CC" />
            <stop offset="0.55" stopColor="#5E35B1" />
            <stop offset="1" stopColor="#7D2AE8" />
          </linearGradient>
          <linearGradient id="bl-swoosh" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#bl-emblem)" />
        <path d="M27.6 13.2a9.4 9.4 0 1 0 0.6 13.4" fill="none" stroke="url(#bl-swoosh)" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M29.5 8.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#FFFFFF" />
      </svg>
      {!compact && (
        <svg height="26" viewBox="0 0 150 30" aria-hidden className="hidden sm:block">
          <defs>
            <linearGradient id="bl-word" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#00C4CC" />
              <stop offset="0.5" stopColor="#5E35B1" />
              <stop offset="1" stopColor="#7D2AE8" />
            </linearGradient>
          </defs>
          <text x="0" y="23" style={{ fontFamily: 'var(--font-space), sans-serif' }} fontWeight="700" fontSize="24" letterSpacing="-0.6" fill="url(#bl-word)">
            CanvaCraft
          </text>
        </svg>
      )}
      {!compact && <span className="pro-crown rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#1a1030]">PRO</span>}
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
    </Link>
  );
}
