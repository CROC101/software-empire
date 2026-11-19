// Drawn placeholder pictures: each seed gives a stable little scene, so the app needs no photos.
import { memo } from 'react';

const PALETTES = [
  ['#ffb88c', '#de6262', '#ffe29f', '#6a3093', '#a044ff'],
  ['#a1c4fd', '#c2e9fb', '#fff1a8', '#2b5876', '#4e4376'],
  ['#f6d365', '#fda085', '#fff8e1', '#355c7d', '#6c5b7b'],
  ['#0f2027', '#2c5364', '#f9d423', '#1b3a4b', '#203a43'],
  ['#84fab0', '#8fd3f4', '#fffbd5', '#11998e', '#38ef7d'],
  ['#fbc2eb', '#a6c1ee', '#ffffff', '#6a11cb', '#2575fc'],
  ['#ff9a9e', '#fecfef', '#fff3b0', '#c94b4b', '#4b134f'],
  ['#43cea2', '#185a9d', '#ffe259', '#0b3d2e', '#1d6b4f'],
  ['#ee9ca7', '#ffdde1', '#ffffff', '#8e2de2', '#4a00e0'],
  ['#232526', '#414345', '#ff6a3d', '#0d0d0d', '#1a1a2e'],
  ['#fceabb', '#f8b500', '#fff', '#a8571a', '#5c3317'],
  ['#e0c3fc', '#8ec5fc', '#fff', '#3a1c71', '#d76d77'],
];

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export const Art = memo(function Art({ seed, variant }: { seed: number; variant?: 'portrait' }) {
  const p = PALETTES[seed % PALETTES.length];
  const r = rng(seed);
  const id = `a${seed}${variant ?? ''}`;
  const kind = variant === 'portrait' ? 5 : seed % 5;
  return (
    <svg className="art" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2={r() > 0.5 ? 1 : 0} y2="1">
          <stop offset="0" stopColor={p[0]} />
          <stop offset="1" stopColor={p[1]} />
        </linearGradient>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor={p[2]} stopOpacity="1" />
          <stop offset="1" stopColor={p[2]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-50" y="-50" width="200" height="200" fill={`url(#${id}s)`} />
      {kind === 0 && (
        <g>
          <circle cx={30 + r() * 40} cy={30 + r() * 10} r="22" fill={`url(#${id}g)`} />
          <circle cx={30 + r() * 40} cy={34} r="9" fill={p[2]} opacity=".9" />
          <path d={`M-50 ${70 + r() * 6} Q 20 ${45 + r() * 10} 60 ${66} T 150 ${60 + r() * 8} V150 H-50Z`} fill={p[3]} opacity=".85" />
          <path d={`M-50 ${82} Q 30 ${66 + r() * 8} 70 ${80} T 150 ${74} V150 H-50Z`} fill={p[4]} />
        </g>
      )}
      {kind === 1 && (
        <g>
          <circle cx="50" cy={44} r="14" fill={p[2]} opacity=".95" />
          <rect x="-50" y="55" width="200" height="100" fill={p[3]} opacity=".9" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M-50 ${60 + i * 8} q 12.5 -3 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0 t 25 0`} stroke={p[2]} strokeOpacity={0.5 - i * 0.08} strokeWidth="1.2" fill="none" />
          ))}
        </g>
      )}
      {kind === 2 && (
        <g>
          <circle cx={70} cy={22} r="7" fill={p[2]} opacity=".9" />
          {Array.from({ length: 11 }, (_, i) => {
            const h = 25 + r() * 45;
            const w = 8 + r() * 6;
            return (
              <g key={i}>
                <rect x={-8 + i * 11} y={100 - h} width={w} height={h + 50} fill={i % 2 ? p[3] : p[4]} />
                {Array.from({ length: Math.floor(h / 8) }, (_, j) => (
                  <rect key={j} x={-6 + i * 11} y={104 - h + j * 8} width="2" height="2.4" fill={p[2]} opacity={r() > 0.45 ? 0.9 : 0.15} />
                ))}
              </g>
            );
          })}
        </g>
      )}
      {kind === 3 && (
        <g style={{ mixBlendMode: 'screen' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={r() * 100} cy={r() * 100} r={12 + r() * 26} fill={p[(i % 3) + 2]} opacity={0.35 + r() * 0.3} />
          ))}
        </g>
      )}
      {kind === 4 && (
        <g>
          <circle cx="50" cy="52" r="32" fill="#ffffff" opacity=".92" />
          <circle cx="50" cy="52" r="24" fill={p[3]} opacity=".85" />
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={38 + r() * 24} cy={40 + r() * 24} r={2 + r() * 4} fill={p[(i % 2) + 1]} />
          ))}
          <rect x="84" y="20" width="4" height="60" rx="2" fill="#ffffffcc" />
          <rect x="12" y="20" width="4" height="60" rx="2" fill="#ffffffcc" />
        </g>
      )}
      {kind === 5 && (
        <g>
          <circle cx="50" cy="40" r="17" fill="#ffffffd9" />
          <path d="M14 104 C 16 72, 34 62, 50 62 S 84 72, 86 104 Z" fill="#ffffffd9" />
        </g>
      )}
    </svg>
  );
});
