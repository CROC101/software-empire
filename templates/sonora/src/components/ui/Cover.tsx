/* eslint-disable @next/next/no-img-element */
import type { CoverArt } from '@/types/spotify';

/** Artwork: a real image when there is one, otherwise an original generated gradient design. */
export default function Cover({
  cover,
  label,
  round,
  className = '',
  big,
}: {
  cover: CoverArt;
  label?: string;
  round?: boolean;
  className?: string;
  big?: boolean;
}) {
  const shape = round ? 'rounded-full' : 'rounded-img';
  if (cover.image)
    return <img src={cover.image} alt={label ?? ''} className={`${shape} object-cover shadow-[0_8px_24px_rgba(0,0,0,.5)] ${className}`} loading="lazy" />;
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden ${shape} shadow-[0_8px_24px_rgba(0,0,0,.5)] ${className}`}
      style={{ background: `linear-gradient(135deg, ${cover.color} 0%, #121212 120%)` }}
    >
      <div className="absolute -right-[8%] top-[8%] h-[46%] w-[46%] rounded-full opacity-85" style={{ background: cover.accent }} />
      <div className="absolute bottom-[18%] left-0 h-[10%] w-[70%] opacity-60" style={{ background: cover.accent }} />
      {label && !round && (
        <span className={`absolute bottom-[6%] left-[8%] right-[8%] truncate font-black leading-none text-white ${big ? 'text-[28px]' : 'text-[13px]'}`}>
          {label}
        </span>
      )}
    </div>
  );
}

export function Mosaic({ covers, label, className = '' }: { covers: CoverArt[]; label: string; className?: string }) {
  if (covers.length < 4) return <Cover cover={covers[0] ?? { color: '#333', accent: '#1ed760' }} label={label} big className={className} />;
  return (
    <div className={`grid grid-cols-2 overflow-hidden rounded-img shadow-[0_8px_24px_rgba(0,0,0,.5)] ${className}`}>
      {covers.slice(0, 4).map((c, i) => (
        <Cover key={i} cover={c} className="!rounded-none !shadow-none h-full w-full" />
      ))}
    </div>
  );
}
