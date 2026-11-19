import { TITLES } from '../data/catalog';

// A 16:9 picture (like the original's single 1920x1080 backdrop) with the tilted poster grid baked in.
const VW = 1920, VH = 1080, PW = 250, PH = 350, GAP = 20, COLS = 10, ROWS = 6;
const items = Array.from({ length: COLS * ROWS }, (_, i) => TITLES[(i * 7) % TITLES.length]);
const GX = VW / 2 - (COLS * (PW + GAP) - GAP) / 2, GY = VH / 2 - (ROWS * (PH + GAP) - GAP) / 2;
const WALL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}"><rect width="100%" height="100%" fill="#000"/><g transform="rotate(-14 ${VW / 2} ${VH / 2})">` +
    items
      .map((t, i) => `<image href="${t.poster}" x="${GX + (i % COLS) * (PW + GAP)}" y="${GY + Math.floor(i / COLS) * (PH + GAP)}" width="${PW}" height="${PH}"/>`)
      .join('') +
    '</g></svg>',
)}`;

/**
 * Tilted wall of (original, generated) posters used behind public hero sections.
 * zoom: 150%-wide picture offset like the redeem page; bg: CSS background instead of an <img>.
 */
export function PosterWall({ className = '', dim = 0.55, zoom = false, bg = false }: { className?: string; dim?: number; zoom?: boolean; bg?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {bg ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${WALL}")` }} />
      ) : (
        <img
          src={WALL}
          alt=""
          className={zoom ? 'absolute left-1/2 top-1/2 aspect-video w-[150%] md:min-h-[120%] max-w-none object-cover' : 'absolute inset-0 h-full w-full object-cover'}
          style={zoom ? { transform: 'translate(-57.13%,-55%)' } : undefined}
        />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />
    </div>
  );
}
