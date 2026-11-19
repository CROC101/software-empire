import qrcode from 'qrcode-generator';

/** Crisp SVG QR code: one path, one unit per module, quiet zone of `margin` modules. */
export function qrSvg(text: string, fg = '#141518', bg = '#FFFFFF', level: 'L' | 'M' | 'Q' | 'H' = 'M', margin = 2): string {
  const qr = qrcode(0, level);
  qr.addData(text || ' ', 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const size = n + margin * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
}

/** Deterministic pseudo-random sequence so a seed reproduces the same mesh. */
function rand(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function meshSvg(colors: string[], seed: number, blur: number, w = 1080, h = 1080): string {
  const r = rand(seed);
  const blobs = colors
    .slice(1)
    .concat(colors.slice(1))
    .map((c) => `<circle cx="${Math.round(r() * w)}" cy="${Math.round(r() * h)}" r="${Math.round((0.25 + r() * 0.3) * Math.max(w, h))}" fill="${c}" fill-opacity="0.85"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" fill="${colors[0]}"/><g filter="url(#b)">${blobs}</g></svg>`;
}

export type PatternKind = 'dots' | 'stripes' | 'grid' | 'checker' | 'waves' | 'triangles';
export const PATTERNS: PatternKind[] = ['dots', 'stripes', 'grid', 'checker', 'waves', 'triangles'];

export function patternSvg(kind: PatternKind, fg: string, bg: string, s: number, w = 1080, h = 1080): string {
  const cell: Record<PatternKind, string> = {
    dots: `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 6}" fill="${fg}"/>`,
    stripes: `<rect width="${s / 2}" height="${s}" fill="${fg}" transform="skewX(0)"/>`,
    grid: `<path d="M${s} 0H0V${s}" fill="none" stroke="${fg}" stroke-width="${Math.max(1, s / 20)}"/>`,
    checker: `<rect width="${s / 2}" height="${s / 2}" fill="${fg}"/><rect x="${s / 2}" y="${s / 2}" width="${s / 2}" height="${s / 2}" fill="${fg}"/>`,
    waves: `<path d="M0 ${s / 2}q${s / 4} -${s / 3} ${s / 2} 0t${s / 2} 0" fill="none" stroke="${fg}" stroke-width="${Math.max(2, s / 10)}"/>`,
    triangles: `<path d="M0 ${s}L${s / 2} 0L${s} ${s}z" fill="${fg}"/>`,
  };
  const rot = kind === 'stripes' ? ' patternTransform="rotate(45)"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><pattern id="p" width="${s}" height="${s}" patternUnits="userSpaceOnUse"${rot}>${cell[kind]}</pattern></defs><rect width="${w}" height="${h}" fill="${bg}"/><rect width="${w}" height="${h}" fill="url(#p)"/></svg>`;
}
