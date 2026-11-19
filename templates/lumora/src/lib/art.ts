// Procedural, original artwork (posters, backdrops, avatars) as SVG data URLs: works offline, no third-party art.
import { brand } from '../brand.config';

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export type Palette = [string, string, string];

function motif(r: () => number, w: number, h: number, pal: Palette, kind: number) {
  const out: string[] = [];
  if (kind === 0) {
    // sun + mountain ridges
    out.push(`<circle cx="${w * (0.3 + r() * 0.4)}" cy="${h * (0.3 + r() * 0.15)}" r="${Math.min(w, h) * 0.18}" fill="${pal[2]}" opacity=".85"/>`);
    for (let i = 0; i < 3; i++) {
      const y = h * (0.55 + i * 0.12);
      let d = `M0 ${h} L0 ${y}`;
      for (let x = 0; x <= w; x += w / 6) d += ` L${x} ${y - r() * h * 0.18}`;
      out.push(`<path d="${d} L${w} ${h}Z" fill="#000" opacity="${0.35 + i * 0.2}"/>`);
    }
  } else if (kind === 1) {
    // city skyline
    let x = 0;
    while (x < w) {
      const bw = w * (0.05 + r() * 0.09);
      const bh = h * (0.2 + r() * 0.45);
      out.push(`<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" fill="#000" opacity=".75"/>`);
      for (let k = 0; k < 6; k++)
        out.push(`<rect x="${x + r() * bw * 0.8}" y="${h - bh + r() * bh * 0.9}" width="${w * 0.008}" height="${h * 0.012}" fill="${pal[2]}" opacity=".8"/>`);
      x += bw + w * 0.01;
    }
  } else if (kind === 2) {
    // concentric rings / portal
    const cx = w * (0.35 + r() * 0.3);
    const cy = h * 0.42;
    for (let i = 6; i > 0; i--) out.push(`<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.07 * i}" fill="none" stroke="${pal[2]}" stroke-width="${2 + i}" opacity="${0.12 * i}"/>`);
    out.push(`<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) * 0.06}" fill="#fff" opacity=".85"/>`);
  } else if (kind === 3) {
    // diagonal light beams
    for (let i = 0; i < 5; i++) {
      const x = r() * w;
      out.push(`<polygon points="${x},0 ${x + w * 0.08},0 ${x - w * 0.3},${h} ${x - w * 0.42},${h}" fill="${pal[2]}" opacity="${0.08 + r() * 0.15}"/>`);
    }
    out.push(`<ellipse cx="${w / 2}" cy="${h * 0.95}" rx="${w * 0.6}" ry="${h * 0.15}" fill="#000" opacity=".6"/>`);
  } else {
    // silhouette figure
    const cx = w * (0.4 + r() * 0.2);
    out.push(`<circle cx="${cx}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.09}" fill="#000" opacity=".8"/>`);
    out.push(`<path d="M${cx - w * 0.22} ${h} Q${cx} ${h * 0.45} ${cx + w * 0.22} ${h}Z" fill="#000" opacity=".8"/>`);
    out.push(`<circle cx="${w * r()}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.3}" fill="${pal[2]}" opacity=".25"/>`);
  }
  return out.join('');
}

function base(seed: number, w: number, h: number, pal: Palette, kind: number) {
  const r = rng(seed);
  return `<defs><linearGradient id="g" x1="0" y1="0" x2="${r() > 0.5 ? 1 : 0.3}" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>
<radialGradient id="v" cx=".5" cy=".4" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${motif(r, w, h, pal, kind)}<rect width="${w}" height="${h}" fill="url(#v)"/>`;
}

const titleText = (t: string, x: number, y: number, size: number, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Bebas Neue, Noto Sans Thai Variable, sans-serif" font-weight="700" font-size="${size}" fill="#fff" letter-spacing="1" style="paint-order:stroke" stroke="rgba(0,0,0,.35)" stroke-width="2">${esc(t)}</text>`;

const badge = (x: number, y: number, s: number) =>
  `<text x="${x}" y="${y}" font-family="Bebas Neue, sans-serif" font-size="${s}" fill="${brand.colors.accent}">${esc(brand.monogram)}</text>`;

function wrap(t: string, max: number) {
  const words = t.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export function poster(seed: number, title: string, pal: Palette, kind: number) {
  const w = 360, h = 504;
  const lines = wrap(title, 12);
  const size = lines.length > 2 ? 48 : 60;
  const text = lines.map((l, i) => titleText(l, w / 2, h - 40 - (lines.length - 1 - i) * size * 0.95, size)).join('');
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${base(seed, w, h, pal, kind)}${badge(14, 44, 40)}${text}</svg>`);
}

export function backdrop(seed: number, title: string | null, pal: Palette, kind: number) {
  const w = 1280, h = 720;
  const text = title ? wrap(title, 16).map((l, i) => titleText(l, 70, 560 + i * 70, 76, 'start')).join('') : '';
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">${base(seed, w, h, pal, kind)}${title ? badge(70, 470, 56) : ''}${text}</svg>`);
}

/** Boxart for row cards: 16:9 with title bottom-left. */
export function boxart(seed: number, title: string, pal: Palette, kind: number) {
  const w = 640, h = 360;
  const lines = wrap(title, 14);
  const text = lines.map((l, i) => titleText(l, 24, h - 26 - (lines.length - 1 - i) * 46, 48, 'start')).join('');
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${base(seed, w, h, pal, kind)}${badge(18, 50, 44)}${text}</svg>`);
}

export function stillFrame(seed: number, pal: Palette, kind: number) {
  const w = 320, h = 180;
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${base(seed, w, h, pal, kind)}</svg>`);
}

/** Profile avatars: a simple smiling square in a solid colour. */
export const AVATAR_COLORS = ['#0071eb', '#e5b109', '#e50914', '#2fc56b', '#8c4bd6', '#ff7a1a', '#14b8a6', '#d6336c'];
export function avatar(i: number) {
  const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
  const eyes = i % 2 ? `<rect x="58" y="62" width="12" height="20" rx="3" fill="#fff"/><rect x="130" y="62" width="12" height="20" rx="3" fill="#fff"/>` : `<circle cx="64" cy="72" r="9" fill="#fff"/><circle cx="136" cy="72" r="9" fill="#fff"/>`;
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${c}"/>${eyes}<path d="M52 118 Q100 ${150 + (i % 3) * 8} 148 118" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`);
}
