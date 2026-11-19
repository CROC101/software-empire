import type { CanvasElement, DesignPage, DesignProject, Paint } from '@/types/canva';
import { fontString, shapePath, wrapLines } from './design';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------------- canvas (PNG) ---------------- */

function canvasPaint(ctx: CanvasRenderingContext2D, p: Paint, w: number, h: number): string | CanvasGradient {
  if (typeof p === 'string') return p;
  let g: CanvasGradient;
  if (p.kind === 'radial') {
    g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2);
  } else {
    // Same geometry as CSS linear-gradient(angle): gradient line through the centre, long enough to hit the corners.
    const a = ((p.angle ?? 135) * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    g = ctx.createLinearGradient(w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half);
  }
  g.addColorStop(0, p.stops[0]);
  g.addColorStop(1, p.stops[1]);
  return g;
}

const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image failed to load'));
      img.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

async function drawElement(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const { w, h } = el;
  ctx.save();
  ctx.translate(el.x + w / 2, el.y + h / 2);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = el.opacity;
  if (el.shadow && el.type !== 'text') {
    ctx.shadowColor = 'rgba(0,0,0,0.38)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
  }

  if (el.type === 'shape') {
    const path = new Path2D(shapePath(el.shape, w, h, el.radius));
    ctx.fillStyle = canvasPaint(ctx, el.fill ?? '#ccc', w, h);
    ctx.fill(path);
    if (el.strokeWidth) {
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = el.stroke ?? '#000';
      ctx.lineWidth = el.strokeWidth;
      ctx.stroke(path);
    }
  } else if (el.type === 'image' && el.src) {
    try {
      const img = await loadImage(el.src);
      const clip = new Path2D(shapePath('rect', w, h, el.radius ?? 0));
      ctx.save();
      ctx.clip(clip);
      // object-fit: cover
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * s;
      const ih = img.naturalHeight * s;
      ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      ctx.restore();
    } catch {
      /* skip broken images rather than failing the whole export */
    }
  } else if (el.type === 'text') {
    const size = el.fontSize ?? 32;
    const lh = size * (el.lineHeight ?? 1.2);
    ctx.font = fontString(el);
    const lines = wrapLines(el, ctx);
    ctx.font = fontString(el);
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${el.letterSpacing ?? 0}px`;
    ctx.fillStyle = el.color ?? '#000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = el.align === 'center' ? 'center' : el.align === 'right' ? 'right' : 'left';
    const ax = el.align === 'center' ? w / 2 : el.align === 'right' ? w : 0;
    if (el.glow) {
      ctx.shadowColor = el.color ?? '#fff';
      ctx.shadowBlur = size * 0.35;
    } else if (el.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    }
    lines.forEach((line, i) => {
      const y = i * lh + lh / 2;
      ctx.fillText(line, ax, y);
      if (el.underline || el.strike) {
        const lw = ctx.measureText(line).width;
        const x0 = ctx.textAlign === 'center' ? ax - lw / 2 : ctx.textAlign === 'right' ? ax - lw : ax;
        ctx.fillRect(x0, el.underline ? y + size * 0.42 : y, lw, Math.max(1, size / 14));
      }
    });
  }
  ctx.restore();
}

export async function renderPageToCanvas(project: DesignProject, page: DesignPage, scale: number): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(project.width * scale);
  canvas.height = Math.round(project.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');
  ctx.scale(scale, scale);
  ctx.fillStyle = canvasPaint(ctx, page.background, project.width, project.height);
  ctx.fillRect(0, 0, project.width, project.height);
  for (const el of page.elements) if (!el.hidden) await drawElement(ctx, el);
  return canvas;
}

export async function exportPNG(project: DesignProject, scale: 1 | 2, pageIndexes: number[]) {
  for (const i of pageIndexes) {
    const canvas = await renderPageToCanvas(project, project.pages[i], scale);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    download(blob, `${slug(project.title)}${project.pages.length > 1 ? `-page-${i + 1}` : ''}${scale === 2 ? '@2x' : ''}.png`);
  }
}

/* ---------------- SVG ---------------- */

function svgPaintDef(id: string, p: Paint): string {
  if (typeof p === 'string') return '';
  const stops = `<stop offset="0" stop-color="${p.stops[0]}"/><stop offset="1" stop-color="${p.stops[1]}"/>`;
  return p.kind === 'radial'
    ? `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.71">${stops}</radialGradient>`
    : `<linearGradient id="${id}" gradientTransform="rotate(${(p.angle ?? 135) - 90} 0.5 0.5)">${stops}</linearGradient>`;
}

const svgFill = (id: string, p: Paint) => (typeof p === 'string' ? p : `url(#${id})`);

export function pageToSVG(project: DesignProject, page: DesignPage): string {
  const defs: string[] = ['<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-opacity="0.38"/></filter>'];
  const body: string[] = [];
  defs.push(svgPaintDef('bg', page.background));
  body.push(`<rect width="${project.width}" height="${project.height}" fill="${svgFill('bg', page.background)}"/>`);
  page.elements.forEach((el, i) => {
    if (el.hidden) return;
    const { w, h } = el;
    const flip = el.flipH || el.flipV ? ` translate(${el.flipH ? w : 0} ${el.flipV ? h : 0}) scale(${el.flipH ? -1 : 1} ${el.flipV ? -1 : 1})` : '';
    const open = `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation} ${w / 2} ${h / 2})${flip}" opacity="${el.opacity}"${el.shadow && el.type !== 'text' ? ' filter="url(#shadow)"' : ''}>`;
    let inner = '';
    if (el.type === 'shape') {
      const id = `f${i}`;
      defs.push(svgPaintDef(id, el.fill ?? '#ccc'));
      inner = `<path d="${shapePath(el.shape, w, h, el.radius)}" fill="${svgFill(id, el.fill ?? '#ccc')}"${el.strokeWidth ? ` stroke="${el.stroke}" stroke-width="${el.strokeWidth}"` : ''}/>`;
    } else if (el.type === 'image' && el.src) {
      defs.push(`<clipPath id="c${i}"><path d="${shapePath('rect', w, h, el.radius ?? 0)}"/></clipPath>`);
      inner = `<image href="${esc(el.src)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c${i})"/>`;
    } else if (el.type === 'text') {
      const size = el.fontSize ?? 32;
      const lh = size * (el.lineHeight ?? 1.2);
      const anchor = el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start';
      const ax = el.align === 'center' ? w / 2 : el.align === 'right' ? w : 0;
      const deco = [el.underline && 'underline', el.strike && 'line-through'].filter(Boolean).join(' ');
      const glow = el.glow ? ` style="filter: drop-shadow(0 0 ${Math.round(size * 0.3)}px ${el.color})"` : '';
      const tspans = wrapLines(el)
        .map((line, li) => `<tspan x="${ax}" y="${li * lh + lh / 2}">${esc(line)}</tspan>`)
        .join('');
      inner = `<text font-family="'${el.fontFamily ?? 'Inter'}', sans-serif" font-size="${size}" font-weight="${el.fontWeight ?? 400}"${el.italic ? ' font-style="italic"' : ''} fill="${el.color}" text-anchor="${anchor}" dominant-baseline="central" letter-spacing="${el.letterSpacing ?? 0}"${deco ? ` text-decoration="${deco}"` : ''}${glow}>${tspans}</text>`;
    }
    body.push(`${open}${inner}</g>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${project.width}" height="${project.height}" viewBox="0 0 ${project.width} ${project.height}"><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
}

export function exportSVG(project: DesignProject, pageIndexes: number[]) {
  for (const i of pageIndexes) {
    download(new Blob([pageToSVG(project, project.pages[i])], { type: 'image/svg+xml' }), `${slug(project.title)}${project.pages.length > 1 ? `-page-${i + 1}` : ''}.svg`);
  }
}

export function exportJSON(project: DesignProject) {
  download(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${slug(project.title)}.json`);
}

