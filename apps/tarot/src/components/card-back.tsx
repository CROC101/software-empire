import { useId } from "react";

/**
 * The back every card shares: cream line work on deep plum — a double frame with fans in the
 * corners, a crescent moon in a sunburst, a starred axis top to bottom, faint orbits and a scatter
 * of stars. Drawn in SVG at the scans' size (420 × 731), so it is crisp at any width.
 */

const W = 420;
const H = 731;
const CX = W / 2;
const CY = H / 2;

/** A four-point star (a sparkle) centred on x, y. */
function sparkle(x: number, y: number, r: number) {
  const k = r * 0.22;
  return `M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

// the scatter is fixed: a tiny seeded generator, so every card back is the same
function scatter() {
  let s = 7;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const dots: [number, number, number][] = [];
  const stars: [number, number, number][] = [];
  while (dots.length < 90) {
    const x = 34 + rand() * (W - 68);
    const y = 34 + rand() * (H - 68);
    // keep the moon's halo and the axis clear
    if (Math.hypot(x - CX, y - CY) < 150 || Math.abs(x - CX) < 8) continue;
    dots.push([x, y, 0.6 + rand() * 1.4]);
  }
  while (stars.length < 12) {
    const x = 44 + rand() * (W - 88);
    const y = 50 + rand() * (H - 100);
    if (Math.hypot(x - CX, y - CY) < 160 || Math.abs(x - CX) < 24) continue;
    stars.push([x, y, 5 + rand() * 7]);
  }
  return { dots, stars };
}
const { dots, stars } = scatter();

// sunburst: long and short rays alternating round the moon
const RAYS = Array.from({ length: 64 }, (_, i) => {
  const a = (i / 64) * Math.PI * 2;
  const long = i % 2 === 0;
  const r1 = 72;
  const r2 = long ? 138 : 108;
  return [
    CX + Math.cos(a) * r1,
    CY + Math.sin(a) * r1,
    CX + Math.cos(a) * r2,
    CY + Math.sin(a) * r2,
  ] as const;
});

/** Five rays fanning out of a corner, pointing into the card. */
function Fan({ x, y, sx, sy }: { x: number; y: number; sx: 1 | -1; sy: 1 | -1 }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i + 0.5) / 5) * (Math.PI / 2);
        const len = i === 2 ? 52 : i % 2 ? 40 : 30;
        return (
          <line
            key={i}
            x1={x + sx * Math.cos(a) * 10}
            y1={y + sy * Math.sin(a) * 10}
            x2={x + sx * Math.cos(a) * len}
            y2={y + sy * Math.sin(a) * len}
          />
        );
      })}
    </g>
  );
}

export function CardBack({ className }: { className?: string }) {
  // a pick fan shows sixteen backs at once: each needs its own clip id
  const clip = `tt-back-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
      className={className ?? "block size-full"}
      style={{ background: "var(--tt-back-bg)" }}
    >
      <g fill="none" stroke="var(--tt-back-ink)" strokeLinecap="round">
        {/* double frame */}
        <rect x={12} y={12} width={W - 24} height={H - 24} rx={20} strokeWidth={3} />
        <rect x={22} y={22} width={W - 44} height={H - 44} rx={14} strokeWidth={1.4} />

        <g strokeWidth={2}>
          <Fan x={26} y={26} sx={1} sy={1} />
          <Fan x={W - 26} y={26} sx={-1} sy={1} />
          <Fan x={26} y={H - 26} sx={1} sy={-1} />
          <Fan x={W - 26} y={H - 26} sx={-1} sy={-1} />
        </g>

        {/* faint orbits, clipped by the frame */}
        <clipPath id={clip}>
          <rect x={22} y={22} width={W - 44} height={H - 44} rx={14} />
        </clipPath>
        <g clipPath={`url(#${clip})`} strokeWidth={0.9} opacity={0.45}>
          <circle cx={CX} cy={CY} r={168} />
          <circle cx={CX} cy={CY} r={222} />
          <circle cx={CX} cy={CY} r={300} />
        </g>

        {/* axis with its beads */}
        <line x1={CX} y1={44} x2={CX} y2={CY - 150} strokeWidth={1.4} />
        <line x1={CX} y1={CY + 150} x2={CX} y2={H - 44} strokeWidth={1.4} />
        <line x1={52} y1={CY} x2={CX - 150} y2={CY} strokeWidth={1.2} />
        <line x1={CX + 150} y1={CY} x2={W - 52} y2={CY} strokeWidth={1.2} />

        {/* sunburst and moon */}
        <g strokeWidth={1.3}>
          {RAYS.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <circle cx={CX} cy={CY} r={62} strokeWidth={2.4} fill="var(--tt-back-bg)" />
      </g>

      <g fill="var(--tt-back-ink)">
        {/* crescent: a full disc with a background disc bitten out of it */}
        <circle cx={CX - 4} cy={CY} r={46} />
        <circle cx={CX + 12} cy={CY - 4} r={40} fill="var(--tt-back-bg)" />

        {[70, 150].map((d) => (
          <path key={`t${String(d)}`} d={sparkle(CX, d, d === 70 ? 16 : 10)} />
        ))}
        {[H - 70, H - 150].map((d) => (
          <path key={`b${String(d)}`} d={sparkle(CX, d, d === H - 70 ? 16 : 10)} />
        ))}
        {[110, 190, H - 110, H - 190].map((y) => (
          <circle key={y} cx={CX} cy={y} r={3.2} />
        ))}
        <path d={sparkle(CX - 150, CY, 8)} />
        <path d={sparkle(CX + 150, CY, 8)} />

        {stars.map(([x, y, r], i) => (
          <path key={`s${String(i)}`} d={sparkle(x, y, r)} />
        ))}
        {dots.map(([x, y, r], i) => (
          <circle key={`d${String(i)}`} cx={x} cy={y} r={r} opacity={0.85} />
        ))}
      </g>
    </svg>
  );
}
