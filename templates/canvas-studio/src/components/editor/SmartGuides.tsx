'use client';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Guides {
  v: number[];
  h: number[];
}

function axis(start: number, size: number, lines: number[], threshold: number) {
  const pts = [start, start + size / 2, start + size];
  let best: number | null = null;
  for (const l of lines) for (const p of pts) if (Math.abs(l - p) <= threshold && (best === null || Math.abs(l - p) < Math.abs(best))) best = l - p;
  const next = start + (best ?? 0);
  const hits = lines.filter((l) => [next, next + size / 2, next + size].some((p) => Math.abs(l - p) < 0.5));
  return { pos: next, hits: Array.from(new Set(hits)) };
}

/** Snap a moving box to the artboard edges/centre and to the other elements' edges/centres. */
export function snapBox(box: Box, others: Box[], W: number, H: number, threshold: number): { x: number; y: number; guides: Guides } {
  const xs = [0, W / 2, W, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const ys = [0, H / 2, H, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const ax = axis(box.x, box.w, xs, threshold);
  const ay = axis(box.y, box.h, ys, threshold);
  return { x: ax.pos, y: ay.pos, guides: { v: ax.hits, h: ay.hits } };
}

/** Magenta guide lines, drawn in screen space over the zoomed artboard. */
export function SmartGuides({ guides, zoom, W, H }: { guides: Guides; zoom: number; W: number; H: number }) {
  return (
    <>
      {guides.v.map((x) => (
        <div key={`v${x}`} className="pointer-events-none absolute top-0 z-30 w-px bg-snap" style={{ left: x * zoom, height: H * zoom }} />
      ))}
      {guides.h.map((y) => (
        <div key={`h${y}`} className="pointer-events-none absolute left-0 z-30 h-px bg-snap" style={{ top: y * zoom, width: W * zoom }} />
      ))}
    </>
  );
}
