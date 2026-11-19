import { useId } from 'react';

/** Original generated cover: a gradient in the category hue with one of six simple motifs. */
export function CoverArt({ hue, motif, label, className = '' }: { hue: number; motif: number; label?: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const a = `hsl(${hue} 75% 62%)`;
  const b = `hsl(${(hue + 40) % 360} 70% 45%)`;
  const light = 'rgba(255,255,255,0.85)';
  const soft = 'rgba(255,255,255,0.22)';
  const shapes = [
    // 0: browser window
    <g key="0">
      <rect x="34" y="20" width="92" height="62" rx="6" fill={light} />
      <rect x="34" y="20" width="92" height="11" rx="6" fill="rgba(255,255,255,0.95)" />
      <circle cx="41" cy="25.5" r="2" fill={a} />
      <circle cx="48" cy="25.5" r="2" fill={b} />
      <rect x="42" y="38" width="44" height="6" rx="3" fill={a} />
      <rect x="42" y="49" width="70" height="4" rx="2" fill={soft} stroke={a} strokeWidth=".6" />
      <rect x="42" y="58" width="30" height="16" rx="3" fill={b} opacity=".7" />
      <rect x="76" y="58" width="36" height="16" rx="3" fill={a} opacity=".5" />
    </g>,
    // 1: logo mark
    <g key="1">
      <circle cx="80" cy="50" r="30" fill={soft} />
      <circle cx="80" cy="50" r="20" fill={light} />
      <path d="M70 56 80 38l10 18Z" fill={b} />
      <circle cx="122" cy="22" r="6" fill={soft} />
      <circle cx="36" cy="80" r="9" fill={soft} />
    </g>,
    // 2: chart
    <g key="2">
      <rect x="32" y="22" width="96" height="58" rx="8" fill={light} />
      <rect x="44" y="56" width="10" height="16" rx="2" fill={a} />
      <rect x="60" y="46" width="10" height="26" rx="2" fill={b} />
      <rect x="76" y="38" width="10" height="34" rx="2" fill={a} />
      <rect x="92" y="30" width="10" height="42" rx="2" fill={b} />
      <path d="m44 44 18-8 16 4 30-12" stroke={b} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>,
    // 3: document
    <g key="3">
      <rect x="54" y="14" width="52" height="72" rx="5" fill={light} />
      {[26, 34, 42, 50, 58].map((y, i) => (
        <rect key={y} x="62" y={y} width={i % 2 ? 28 : 36} height="3.5" rx="1.75" fill={i === 0 ? b : a} opacity={i === 0 ? 1 : 0.55} />
      ))}
      <circle cx="96" cy="74" r="7" fill={b} />
      <circle cx="30" cy="30" r="10" fill={soft} />
    </g>,
    // 4: play
    <g key="4">
      <rect x="30" y="22" width="100" height="56" rx="8" fill={light} />
      <circle cx="80" cy="50" r="15" fill={b} />
      <path d="m76 43 11 7-11 7Z" fill="#fff" />
      <rect x="38" y="70" width="84" height="3" rx="1.5" fill={soft} stroke={a} strokeWidth=".5" />
      <rect x="38" y="70" width="38" height="3" rx="1.5" fill={a} />
    </g>,
    // 5: chat bubbles
    <g key="5">
      <rect x="30" y="24" width="64" height="30" rx="12" fill={light} />
      <path d="m42 52-4 10 12-8Z" fill={light} />
      <rect x="66" y="50" width="64" height="26" rx="12" fill={b} opacity=".85" />
      <circle cx="50" cy="39" r="3" fill={a} />
      <circle cx="62" cy="39" r="3" fill={a} />
      <circle cx="74" cy="39" r="3" fill={a} />
    </g>,
  ];
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={label ?? ''}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={`url(#g${id})`} />
      <circle cx="150" cy="-4" r="34" fill="rgba(255,255,255,0.12)" />
      <circle cx="4" cy="104" r="28" fill="rgba(255,255,255,0.1)" />
      {shapes[((motif % 6) + 6) % 6]}
    </svg>
  );
}
