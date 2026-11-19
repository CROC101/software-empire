import { seeded } from "@/lib/format";

/** Procedural 16:9 cover. `frame` shifts the scene so hover-scrubbing shows motion. */
export function CoverArt({
  seed,
  palette,
  frame = 0,
  label,
  className = "",
}: {
  seed: string;
  palette: [string, string, string];
  frame?: number;
  label?: string;
  className?: string;
}) {
  const r = seeded(seed);
  const [a, b, bg] = palette;
  const angle = Math.round(r() * 360) + frame * 14;
  const cx = 60 + r() * 200 + frame * 18;
  const cy = 50 + r() * 70 - frame * 4;
  const rad = 28 + r() * 40 + frame * 2;
  const peaks = Array.from({ length: 6 }, (_, i) => `${i * 64},${110 + r() * 50 - frame * 3 * ((i % 2) * 2 - 1)}`).join(" ");
  const id = `g-${seed}-${frame}`.replace(/[^a-z0-9-]/gi, "");
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientTransform={`rotate(${angle % 360} .5 .5)`}>
          <stop offset="0" stopColor={bg} />
          <stop offset="0.65" stopColor={b} stopOpacity="0.55" />
          <stop offset="1" stopColor={a} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={bg} />
      <rect width="320" height="180" fill={`url(#${id})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1="0" x2="320" y1={130 + i * 8} y2={130 + i * 8} stroke={a} strokeOpacity={0.12} />
      ))}
      <circle cx={cx % 340} cy={cy} r={rad} fill={a} fillOpacity="0.85" />
      <circle cx={cx % 340} cy={cy} r={rad + 10} fill="none" stroke={a} strokeOpacity="0.35" />
      <polygon points={`0,180 ${peaks} 320,180`} fill={bg} fillOpacity="0.9" stroke={b} strokeOpacity="0.6" />
      {label && (
        <text x="16" y="164" fill="#fff" fillOpacity="0.18" fontSize="34" fontWeight="700" fontFamily="Arial">
          {label}
        </text>
      )}
    </svg>
  );
}
