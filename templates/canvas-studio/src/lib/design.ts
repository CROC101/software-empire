import type { CanvasElement, DesignPage, DesignProject, FontFamily, Paint, ShapeKind } from '@/types/canva';

export const uid = (prefix = 'el') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const SPRING = { type: 'spring', stiffness: 420, damping: 32 } as const;

export const FONT_FAMILIES: FontFamily[] = ['Inter', 'Playfair Display', 'JetBrains Mono', 'Oswald', 'Space Grotesk', 'Pacifico'];

const FONT_VARS: Record<FontFamily, string> = {
  Inter: '--font-inter',
  'Playfair Display': '--font-playfair',
  'JetBrains Mono': '--font-jetbrains',
  Oswald: '--font-oswald',
  'Space Grotesk': '--font-space',
  Pacifico: '--font-pacifico',
};

export const fontCss = (f?: FontFamily) => `var(${FONT_VARS[f ?? 'Inter']}), system-ui, sans-serif`;

/** The real (hashed) family list next/font registered, for canvas + SVG export. */
export function resolveFont(f: FontFamily = 'Inter'): string {
  if (typeof document === 'undefined') return `"${f}"`;
  const v = getComputedStyle(document.documentElement).getPropertyValue(FONT_VARS[f]).trim();
  return v || `"${f}", sans-serif`;
}

export function paintToCss(p: Paint | undefined): string {
  if (!p) return 'transparent';
  if (typeof p === 'string') return p;
  if (p.kind === 'radial') return `radial-gradient(circle farthest-corner at center, ${p.stops[0]}, ${p.stops[1]})`;
  return `linear-gradient(${p.angle ?? 135}deg, ${p.stops[0]}, ${p.stops[1]})`;
}

export const firstColor = (p: Paint | undefined): string => (!p ? '#000000' : typeof p === 'string' ? p : p.stops[0]);

const n = (v: number) => Math.round(v * 100) / 100;

function roundRect(w: number, h: number, r: number): string {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r === 0) return `M0 0H${n(w)}V${n(h)}H0Z`;
  return `M${n(r)} 0H${n(w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(w)} ${n(r)}V${n(h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(w - r)} ${n(h)}H${n(r)}A${n(r)} ${n(r)} 0 0 1 0 ${n(h - r)}V${n(r)}A${n(r)} ${n(r)} 0 0 1 ${n(r)} 0Z`;
}

const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;

/** One SVG path per shape, shared by the DOM stage, SVG export and canvas export (Path2D). */
export function shapePath(kind: ShapeKind | undefined, w: number, h: number, radius = 0): string {
  switch (kind) {
    case 'roundedRect':
      return roundRect(w, h, radius || 24);
    case 'pill':
    case 'line':
      return roundRect(w, h, Math.min(w, h) / 2);
    case 'circle':
      return `M0 ${n(h / 2)}A${n(w / 2)} ${n(h / 2)} 0 1 0 ${n(w)} ${n(h / 2)}A${n(w / 2)} ${n(h / 2)} 0 1 0 0 ${n(h / 2)}Z`;
    case 'triangle':
      return poly([[w / 2, 0], [w, h], [0, h]]);
    case 'star': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const k = i % 2 === 0 ? 1 : 0.45;
        pts.push([w / 2 + (w / 2) * k * Math.cos(a), h / 2 + (h / 2) * k * Math.sin(a)]);
      }
      return poly(pts);
    }
    case 'hexagon': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pts.push([w / 2 + (w / 2) * Math.cos(a), h / 2 + (h / 2) * Math.sin(a)]);
      }
      return poly(pts);
    }
    case 'arrow': {
      const sh = h * 0.36;
      const hl = Math.min(w * 0.4, h);
      return poly([[0, h / 2 - sh / 2], [w - hl, h / 2 - sh / 2], [w - hl, 0], [w, h / 2], [w - hl, h], [w - hl, h / 2 + sh / 2], [0, h / 2 + sh / 2]]);
    }
    default:
      return roundRect(w, h, radius);
  }
}

/* ---------- text measuring (shared by stage + exporters) ---------- */

let measureCtx: CanvasRenderingContext2D | null = null;
function getCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx;
}

export const fontString = (el: CanvasElement, family = resolveFont(el.fontFamily)) =>
  `${el.italic ? 'italic ' : ''}${el.fontWeight ?? 400} ${el.fontSize ?? 32}px ${family}`;

export const displayText = (el: CanvasElement) => (el.uppercase ? (el.text ?? '').toUpperCase() : el.text ?? '');

export function wrapLines(el: CanvasElement, ctx: CanvasRenderingContext2D | null = getCtx()): string[] {
  const text = displayText(el);
  const size = el.fontSize ?? 32;
  const ls = el.letterSpacing ?? 0;
  const width = (s: string) => (ctx ? ctx.measureText(s).width : s.length * size * 0.55) + ls * s.length;
  if (ctx) ctx.font = fontString(el);
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && width(next) > el.w) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export const textHeight = (el: CanvasElement) =>
  Math.ceil(wrapLines(el).length * (el.fontSize ?? 32) * (el.lineHeight ?? 1.2));

/** Re-fit a text box height after its text, font or width changed. */
export const fitText = (el: CanvasElement): CanvasElement => (el.type === 'text' ? { ...el, h: Math.max(textHeight(el), 8) } : el);

/* ---------- project helpers ---------- */

export function clonePage(p: DesignPage): DesignPage {
  return { ...structuredClone(p), id: uid('pg'), elements: p.elements.map((e) => ({ ...structuredClone(e), id: uid() })) };
}

export function blankPage(background: Paint = '#FFFFFF'): DesignPage {
  return { id: uid('pg'), background, elements: [] };
}

/**
 * Magic Resize: positions follow the new width/height ratio, sizes scale by the smaller ratio so nothing distorts;
 * full-bleed elements (backgrounds, banners) stretch to the new edges.
 */
export function resizeProject(p: DesignProject, W: number, H: number): DesignProject {
  const sx = W / p.width;
  const sy = H / p.height;
  const s = Math.min(sx, sy);
  const pages = p.pages.map((pg) => ({
    ...pg,
    elements: pg.elements.map((e) => {
      const fullW = e.x <= 1 && e.x + e.w >= p.width - 1;
      const fullH = e.y <= 1 && e.y + e.h >= p.height - 1;
      const w = fullW ? e.w * sx : e.w * s;
      const h = fullH ? e.h * sy : e.h * s;
      const cx = (e.x + e.w / 2) * sx;
      const cy = (e.y + e.h / 2) * sy;
      const next: CanvasElement = { ...e, w, h, x: cx - w / 2, y: cy - h / 2 };
      if (e.type === 'text') {
        next.fontSize = Math.max(6, Math.round((e.fontSize ?? 32) * s));
        next.w = e.w * s;
        next.x = cx - next.w / 2;
        return fitText(next);
      }
      if (e.strokeWidth) next.strokeWidth = e.strokeWidth * s;
      if (e.radius) next.radius = e.radius * s;
      return next;
    }),
  }));
  return { ...p, width: W, height: H, pages };
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 400, h: img.naturalHeight || 400 });
    img.onerror = () => resolve({ w: 400, h: 400 });
    img.src = src;
  });
}

export const ratioLabel = (w: number, h: number) => (Math.abs(w - h) < 2 ? 'Square' : w > h ? 'Landscape' : 'Portrait');
