"use client";

import * as React from "react";
import { watchTheme } from "../lib/token-colors";
import {
  at,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  lerp,
  luminance,
  mixRGB,
  project,
  rgbString,
  toRGB,
  type Cam,
  type RGB,
} from "./contribution-skyline";

/**
 * Isometric Hex Chart, by Kedhareswer Naidu (21st.dev/@kedhareswer, MIT), vendored with the
 * strict-lint fixes this repo needs, the shared canvas helpers from ContributionSkyline, colours
 * from our semantic tokens and plain-string labels so a server component can pass them.
 *
 * Values on an axial hex grid, morphing from a flat hex map into extruded isometric columns that
 * rise in a wave from the centre. Hover or tap a cell for its label, arrow keys walk the cells,
 * hover a legend swatch to isolate a level, drag to orbit in 3D (double-click resets).
 * `data` takes `{ q, r, value (0–100), label? }`; `spiral(n)` hands out cells centre-first.
 */

// #region hex math
export type HexDatum = { q: number; r: number; value: number; label?: string };
export type HexView = "2d" | "3d";

export const WAVE = 0.45;
export const riseAt = (t: number, order: number): number =>
  easeOutCubic((t - order * 0.4) / (1 - WAVE));

export const YAW_3D = Math.PI / 6;
export const ELEV_3D = (38 * Math.PI) / 180;
export const YAW_RANGE: [number, number] = [(-15 * Math.PI) / 180, (75 * Math.PI) / 180];
export const ELEV_RANGE: [number, number] = [(15 * Math.PI) / 180, (65 * Math.PI) / 180];

const clampTo = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));

export const camera = (e: number, dYaw = 0, dElev = 0): Cam => {
  const yaw = clampTo(lerp(0, YAW_3D + dYaw, e), YAW_RANGE);
  const elev = lerp(Math.PI / 2, clampTo(ELEV_3D + dElev, ELEV_RANGE), e);
  return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) };
};

/** The 6 corners of a pointy-top hex, as x0 y0 x1 y1 … */
export const hexCell = (cx: number, cy: number, radius: number, gap = 0.05): number[] => {
  const pts: number[] = [];
  const r = radius - gap;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  return pts;
};

/** The first `n` axial cells walking out from the centre ring by ring, so sorted data piles up in the middle. */
export const spiral = (n: number): { q: number; r: number }[] => {
  const out = [{ q: 0, r: 0 }];
  const dirs = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ] as const;
  for (let ring = 1; out.length < n; ring++) {
    let q = -ring;
    let r = ring; // start at dirs[4] * ring, then walk each side
    for (const [dq, dr] of dirs) {
      for (let s = 0; s < ring && out.length < n; s++) {
        out.push({ q, r });
        q += dq;
        r += dr;
      }
    }
  }
  return out.slice(0, Math.max(0, n));
};

/** Ray-casting point in polygon, on `count` x/y pairs from offset `o`. */
export const pointInPoly = (
  p: Float32Array,
  o: number,
  count: number,
  x: number,
  y: number,
): boolean => {
  let inside = false;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const xi = at(p, o + i * 2);
    const yi = at(p, o + i * 2 + 1);
    const xj = at(p, o + j * 2);
    const yj = at(p, o + j * 2 + 1);
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const polyPath = (
  ctx: CanvasRenderingContext2D,
  p: Float32Array,
  o: number,
  count: number,
  r: number,
) => {
  if (r < 0.3) {
    ctx.moveTo(at(p, o), at(p, o + 1));
    for (let k = 1; k < count; k++) ctx.lineTo(at(p, o + k * 2), at(p, o + k * 2 + 1));
    ctx.closePath();
    return;
  }
  const l = (count - 1) * 2;
  ctx.moveTo((at(p, o + l) + at(p, o)) / 2, (at(p, o + l + 1) + at(p, o + 1)) / 2);
  for (let k = 0; k < count; k++) {
    const b = (k + 1) % count;
    ctx.arcTo(at(p, o + k * 2), at(p, o + k * 2 + 1), at(p, o + b * 2), at(p, o + b * 2 + 1), r);
  }
  ctx.closePath();
};
// #endregion

export type HexChartLabels = {
  /** Screen-reader name of the 2D/3D switch. */
  view: string;
  flat: string;
  columns: string;
  hint: string;
  less: string;
  more: string;
  /** Five level names, lowest first. */
  levels: [string, string, string, string, string];
};

const LABELS: HexChartLabels = {
  view: "View",
  flat: "Flat map",
  columns: "3D columns",
  hint: "Drag to orbit, double-click to reset",
  less: "Lower",
  more: "Higher",
  levels: ["None", "Low", "Medium", "High", "Peak"],
};

export interface IsometricHexChartProps {
  data: HexDatum[];
  title?: React.ReactNode;
  hint?: React.ReactNode;
  /** Four colours, lowest to highest, per theme. */
  palette: { light: string[]; dark: string[] };
  defaultView?: HexView;
  orbit?: boolean;
  labels?: Partial<HexChartLabels>;
  footer?: React.ReactNode;
  className?: string;
}

type Box = { pts: number[]; h: number; lv: number; order: number; tip: string };

const FG_FALLBACK: RGB = [23, 23, 23];
const BG_FALLBACK: RGB = [255, 255, 255];
const BG = "var(--background, #ffffff)";
const FG = "var(--foreground, #171717)";
const BORDER = "var(--border, #e5e5e5)";
const MUTED = "var(--muted-foreground, #737373)";

const HexIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="shrink-0">
    <path d="M4 3 L8 1 L12 3 L12 7 L8 9 L4 7 Z" fill="currentColor" />
    <path d="M4 9 L8 7 L12 9 L12 13 L8 15 L4 13 Z" fill="currentColor" />
  </svg>
);
const CubeIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="shrink-0">
    <path
      d="M8 1.2 14.2 4.6v6.8L8 14.8 1.8 11.4V4.6ZM1.8 4.6 8 8l6.2-3.4M8 8v6.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export function IsometricHexChart({
  data,
  title,
  hint,
  palette,
  defaultView = "3d",
  orbit = true,
  labels: labelsIn,
  footer,
  className = "",
}: IsometricHexChartProps) {
  const labels = { ...LABELS, ...labelsIn };
  const [view, setView] = React.useState<HexView>(defaultView);
  const [swatches, setSwatches] = React.useState<string[]>([]);
  const [legendLevel, setLegendLevel] = React.useState(-1);
  const [announce, setAnnounce] = React.useState("");

  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const tipBRef = React.useRef<HTMLElement>(null);
  const tipSRef = React.useRef<HTMLSpanElement>(null);

  const boxes = React.useMemo(() => {
    const w = Math.sqrt(3);
    const cells = data.map((d) => ({ d, cx: w * (d.q + d.r / 2), cy: 1.5 * d.r }));
    const far = Math.max(1, ...cells.map((c) => Math.hypot(c.cx, c.cy)));
    return cells.map<Box>(({ d, cx, cy }) => {
      const v = Math.max(0, Math.min(100, d.value));
      return {
        pts: hexCell(cx, cy, 1, 0.08),
        h: 0.1 + (v / 100) * 8,
        lv: (v / 100) * 4,
        order: clamp01(Math.hypot(cx, cy) / far),
        tip: d.label ?? `${String(d.q)}, ${String(d.r)}\n${String(Math.round(v))}`,
      };
    });
  }, [data]);

  const cfg = React.useRef({ boxes, orbit, palette, legendLevel, target: view === "3d" ? 1 : 0 });
  cfg.current = { boxes, orbit, palette, legendLevel, target: view === "3d" ? 1 : 0 };
  const engineRef = React.useRef<{ kick: () => void; load: () => void; retheme: () => void }>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    const tipB = tipBRef.current;
    const tipS = tipSRef.current;
    if (!root || !stage || !canvas || !tip || !tipB || !tipS) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMq.matches;

    let t = 0;
    let target = cfg.current.target;
    let entered = false;
    let inView = true;
    let yaw = 0;
    let elev = 0;
    let yawGoal = 0;
    let elevGoal = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const col = new Float32Array(15);
    const colGoal = new Float32Array(15);
    let colReady = false;
    let fg: RGB = FG_FALLBACK;

    let list: Box[] = [];
    let n = 0;
    // per cell: 12 floats of top face, then 6 side quads × 8 floats
    let cp = new Float32Array(0);
    let cz = new Float32Array(0);
    let cl = new Float32Array(0);
    let dep = new Float32Array(0);
    let hover = new Float32Array(0);
    let dim = new Float32Array(0);
    let polys = new Float32Array(0);
    let sides = new Uint8Array(0);
    let order: number[] = [];

    let hovered = -1;
    let pinned = -1;
    let active = -1;
    let tipW = 0;
    let tipH = 0;
    let lastTip = "";
    let raf = 0;
    let last = 0;

    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const load = () => {
      list = cfg.current.boxes;
      const m = list.length;
      if (m !== n) {
        n = m;
        cp = new Float32Array(m * 12);
        cz = new Float32Array(m);
        cl = new Float32Array(m);
        dep = new Float32Array(m);
        hover = new Float32Array(m);
        dim = new Float32Array(m);
        polys = new Float32Array(m * 60);
        sides = new Uint8Array(m);
        order = Array.from({ length: m }, (_, i) => i);
        list.forEach((b, i) => {
          cp.set(b.pts, i * 12);
          cz[i] = b.h;
          cl[i] = b.lv;
        });
      }
      if (hovered >= n) hovered = -1;
      if (pinned >= n) pinned = -1;
      if (active >= n) {
        active = -1;
        tip.style.opacity = "0";
      }
    };

    const retheme = () => {
      const cs = getComputedStyle(root);
      fg = toRGB(cs.color, FG_FALLBACK) ?? FG_FALLBACK;
      const bg = toRGB(cs.backgroundColor, BG_FALLBACK) ?? BG_FALLBACK;
      const dark = luminance(bg) < 0.45;
      const pick = cfg.current.palette[dark ? "dark" : "light"];
      const empty = mixRGB(bg, fg, dark ? 0.08 : 0.06);
      const all: RGB[] = [
        empty,
        ...[0, 1, 2, 3].map((i) => toRGB(pick[i] ?? pick.at(-1) ?? "", fg) ?? fg),
      ];
      all.forEach((c, k) => {
        colGoal.set(c, k * 3);
      });
      if (!colReady || reduced) {
        col.set(colGoal);
        colReady = true;
      }
      const sw = all.map((c) => rgbString(c[0], c[1], c[2]));
      setSwatches((prev) => (prev.join() === sw.join() ? prev : sw));
      kick();
    };

    const extent = (cam: Cam, e: number) => {
      let minx = Infinity;
      let maxx = -Infinity;
      let miny = Infinity;
      let maxy = -Infinity;
      for (const b of list) {
        for (let k = 0; k < 6; k++) {
          const x = b.pts[k * 2] ?? 0;
          const y = b.pts[k * 2 + 1] ?? 0;
          for (const z of [0, b.h * e]) {
            const [u, v] = project(cam, x, y, z);
            minx = Math.min(minx, u);
            maxx = Math.max(maxx, u);
            miny = Math.min(miny, v);
            maxy = Math.max(maxy, v);
          }
        }
      }
      return Number.isFinite(minx)
        ? { minx, maxx, miny, maxy }
        : { minx: 0, maxx: 1, miny: 0, maxy: 1 };
    };

    const relayout = () => {
      const w = Math.round(stage.clientWidth);
      if (!w || !n) return;
      W = w;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      H = Math.max(260, Math.min(Math.round(W * 0.55), 450));
      stage.style.height = `${String(H)}px`;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${String(W)}px`;
      canvas.style.height = `${String(H)}px`;
      draw();
    };

    const draw = () => {
      if (!W || !n) return;
      const e = easeInOutCubic(t);
      const cam = camera(e, yaw, elev);
      const bx = extent(cam, e);
      const pad = lerp(12, 24, e);
      const aw = W - pad * 2;
      const ah = H - pad * 2;
      const bw = Math.max(1e-6, bx.maxx - bx.minx);
      const bh = Math.max(1e-6, bx.maxy - bx.miny);
      const s = Math.min(aw / bw, ah / bh);
      const ox = pad + (aw - bw * s) / 2 - bx.minx * s;
      const oy = pad + (ah - bh * s) / 2 - bx.miny * s;
      const { cs, sn, se, ce } = cam;
      const px = (x: number, y: number) => ox + (x * cs - y * sn) * s;
      const py = (x: number, y: number, z: number) => oy + ((x * sn + y * cs) * se - z * ce) * s;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < n; i++) {
        let sx = 0;
        let sy = 0;
        for (let k = 0; k < 6; k++) {
          sx += at(cp, i * 12 + k * 2);
          sy += at(cp, i * 12 + k * 2 + 1);
        }
        dep[i] = (sx * sn + sy * cs) / 6;
      }
      order.sort((a, c) => at(dep, a) - at(dep, c));

      const rad = lerp(0.08, 0.02, e) * s;
      const outline = (1 - e) * 0.15;
      const lift = 0.8 * e;

      for (const i of order) {
        const b = list[i];
        if (!b) continue;
        const o12 = i * 12;
        const o = i * 60;
        const hv = at(hover, i);
        const zt = at(cz, i) * riseAt(t, b.order) + hv * lift;

        let a2 = 0;
        for (let j = 0; j < 6; j++) {
          const jn = (j + 1) % 6;
          const x = at(cp, o12 + j * 2);
          const y = at(cp, o12 + j * 2 + 1);
          polys[o + j * 2] = px(x, y);
          polys[o + j * 2 + 1] = py(x, y, zt);
          a2 += x * at(cp, o12 + jn * 2 + 1) - at(cp, o12 + jn * 2) * y;
        }
        const sg = a2 >= 0 ? 1 : -1;
        const tall = zt * ce * s > 0.35;

        const lf = Math.max(0, Math.min(4, at(cl, i)));
        const k0 = Math.floor(lf);
        const k1 = Math.min(4, k0 + 1);
        const f = lf - k0;
        const ch = (c: number) => at(col, k0 * 3 + c) * (1 - f) + at(col, k1 * 3 + c) * f;
        let r = ch(0);
        let g = ch(1);
        let bl = ch(2);
        const d = at(dim, i);
        if (d > 0.002) {
          r += (at(col, 0) - r) * 0.72 * d;
          g += (at(col, 1) - g) * 0.72 * d;
          bl += (at(col, 2) - bl) * 0.72 * d;
        }
        if (hv > 0.002) {
          const m = 0.22 * hv;
          r += (fg[0] - r) * m;
          g += (fg[1] - g) * m;
          bl += (fg[2] - bl) * m;
        }

        let bits = 0;
        if (tall) {
          for (let j = 0; j < 6; j++) {
            const jn = (j + 1) % 6;
            const xa = at(cp, o12 + j * 2);
            const ya = at(cp, o12 + j * 2 + 1);
            const xb = at(cp, o12 + jn * 2);
            const yb = at(cp, o12 + jn * 2 + 1);
            const dx = xb - xa;
            const dy = yb - ya;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (sg * dy) / len;
            const ny = (-sg * dx) / len;
            if (nx * sn + ny * cs <= 0.02) continue;
            bits |= 1 << j;
            const q = o + 12 + j * 8;
            polys[q] = px(xa, ya);
            polys[q + 1] = py(xa, ya, 0);
            polys[q + 2] = px(xb, yb);
            polys[q + 3] = py(xb, yb, 0);
            polys[q + 4] = at(polys, o + jn * 2);
            polys[q + 5] = at(polys, o + jn * 2 + 1);
            polys[q + 6] = at(polys, o + j * 2);
            polys[q + 7] = at(polys, o + j * 2 + 1);
            const sh = Math.max(0.4, Math.min(0.96, 0.7 - 0.22 * (nx * cs - ny * sn)));
            ctx.beginPath();
            polyPath(ctx, polys, q, 4, 0);
            ctx.fillStyle = rgbString(r * sh, g * sh, bl * sh);
            ctx.fill();
          }
        }
        sides[i] = bits;

        ctx.beginPath();
        polyPath(ctx, polys, o, 6, rad);
        ctx.fillStyle = rgbString(r, g, bl);
        ctx.fill();
        const ink = (a: number) =>
          `rgba(${String(fg[0])},${String(fg[1])},${String(fg[2])},${a.toFixed(3)})`;
        if (outline > 0.004) {
          ctx.strokeStyle = ink(outline);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (hv > 0.02) {
          ctx.strokeStyle = ink(0.88 * hv);
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      const b = list[active];
      if (b) {
        const o = active * 60;
        if (b.tip !== lastTip) {
          lastTip = b.tip;
          const [head = "", ...rest] = b.tip.split("\n");
          tipB.textContent = head;
          tipS.textContent = rest.join(" · ");
          tipW = tip.offsetWidth;
          tipH = tip.offsetHeight;
        }
        let cx = 0;
        let cy = Infinity;
        for (let v = 0; v < 6; v++) {
          cx += at(polys, o + v * 2);
          cy = Math.min(cy, at(polys, o + v * 2 + 1));
        }
        cx /= 6;
        const half = tipW / 2;
        const x = Math.min(W - half - 4, Math.max(half + 4, cx));
        tip.style.transform = `translate(${(x - half).toFixed(1)}px,${Math.max(tipH, cy - 8).toFixed(1)}px) translateY(-100%)`; // never above the stage
        tip.style.setProperty("--arrow", `${(cx - x + half).toFixed(1)}px`);
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (!inView) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      let moving = false;

      if (t !== target) {
        const step = reduced ? 1 : (dt * 1000) / 1300;
        t = target > t ? Math.min(target, t + step) : Math.max(target, t - step);
        moving = true;
      }
      const ko = reduced ? 1 : 1 - Math.exp(-dt * 12);
      yaw += (yawGoal - yaw) * ko;
      elev += (elevGoal - elev) * ko;
      if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(elevGoal - elev) > 1e-4) moving = true;
      else {
        yaw = yawGoal;
        elev = elevGoal;
      }
      const kc = reduced ? 1 : 1 - Math.exp(-dt * 7);
      for (let k = 0; k < 15; k++) {
        const d = at(colGoal, k) - at(col, k);
        if (Math.abs(d) > 0.4) {
          col[k] = at(col, k) + d * kc;
          moving = true;
        } else col[k] = at(colGoal, k);
      }
      const kv = reduced ? 1 : 1 - Math.exp(-dt * 16);
      const kd = reduced ? 1 : 1 - Math.exp(-dt * 10);
      const leg = cfg.current.legendLevel;
      list.forEach((b, i) => {
        const hg = i === active ? 1 : 0;
        const h = at(hover, i);
        if (h !== hg) {
          hover[i] = Math.abs(hg - h) < 0.003 ? hg : h + (hg - h) * kv;
          moving = true;
        }
        const dg = leg >= 0 && Math.round(b.lv) !== leg ? 1 : 0;
        const m = at(dim, i);
        if (m !== dg) {
          dim[i] = Math.abs(dg - m) < 0.003 ? dg : m + (dg - m) * kd;
          moving = true;
        }
      });
      draw();
      if (moving) raf = requestAnimationFrame(tick);
    };

    const refreshActive = () => {
      const next = hovered >= 0 ? hovered : pinned;
      if (next === active) return;
      active = next;
      lastTip = "";
      tip.style.opacity = next >= 0 ? "1" : "0";
      kick();
    };

    const hit = (x: number, y: number): number => {
      for (let k = n - 1; k >= 0; k--) {
        const i = order[k] ?? 0;
        const o = i * 60;
        if (pointInPoly(polys, o, 6, x, y)) return i;
        const bits = sides[i] ?? 0;
        for (let j = 0; j < 6; j++) {
          if (bits & (1 << j) && pointInPoly(polys, o + 12 + j * 8, 4, x, y)) return i;
        }
      }
      return -1;
    };

    const local = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top] as const;
    };
    const cursor = (fallback: string) => (cfg.current.orbit && target === 1 ? "grab" : fallback);

    let drag: {
      id: number;
      x: number;
      y: number;
      yaw: number;
      elev: number;
      moved: boolean;
      orbit: boolean;
      mouse: boolean;
    } | null = null;

    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return;
      const can = cfg.current.orbit && target === 1;
      drag = {
        id: ev.pointerId,
        x: ev.clientX,
        y: ev.clientY,
        yaw: yawGoal,
        elev: elevGoal,
        moved: false,
        orbit: can,
        mouse: ev.pointerType === "mouse",
      };
      if (can) canvas.setPointerCapture(ev.pointerId);
    };
    const onMove = (ev: PointerEvent) => {
      if (drag?.orbit && ev.pointerId === drag.id) {
        const dx = ev.clientX - drag.x;
        const dy = ev.clientY - drag.y;
        if (drag.moved || Math.hypot(dx, dy) > 4) {
          drag.moved = true;
          yawGoal = clampTo(drag.yaw + dx * 0.006, YAW_RANGE);
          if (drag.mouse) elevGoal = clampTo(drag.elev + dy * 0.004, ELEV_RANGE);
          canvas.style.cursor = "grabbing";
          hovered = -1;
          refreshActive();
          kick();
          return;
        }
      }
      if (ev.pointerType !== "mouse") return;
      const [x, y] = local(ev);
      const i = hit(x, y);
      if (i !== hovered) {
        hovered = i;
        refreshActive();
      }
      canvas.style.cursor = cursor(i >= 0 ? "pointer" : "default");
    };
    const onUp = (ev: PointerEvent) => {
      if (drag?.id !== ev.pointerId) return;
      const moved = drag.moved;
      drag = null;
      if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
      canvas.style.cursor = cursor("default");
      if (moved) return;
      const [x, y] = local(ev);
      const i = hit(x, y);
      pinned = i === pinned ? -1 : i;
      if (ev.pointerType !== "mouse") hovered = -1;
      refreshActive();
    };
    const onCancel = () => {
      drag = null;
    };
    const onLeave = () => {
      if (!drag) {
        hovered = -1;
        refreshActive();
      }
    };
    const onDbl = () => {
      yawGoal = 0;
      elevGoal = 0;
      kick();
    };
    const onBlur = () => {
      pinned = -1;
      refreshActive();
    };
    const onKey = (ev: KeyboardEvent) => {
      const step: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -5,
        ArrowDown: 5,
      };
      if (!n || !(ev.key in step || ["Home", "End", "Escape"].includes(ev.key))) return;
      ev.preventDefault();
      if (ev.key === "Escape") {
        pinned = -1;
        hovered = -1;
        refreshActive();
        return;
      }
      let i = pinned >= 0 ? pinned : active;
      if (i < 0) i = 0;
      else if (ev.key === "Home") i = 0;
      else if (ev.key === "End") i = n - 1;
      else i += step[ev.key] ?? 0;
      i = Math.max(0, Math.min(n - 1, i));
      pinned = i;
      hovered = -1;
      refreshActive();
      setAnnounce((list[i]?.tip ?? "").replace(/\n/g, ", "));
    };

    const setTarget = () => {
      const goal = cfg.current.target;
      if (!entered || goal === target) return;
      target = goal;
      if (goal === 0) {
        yawGoal = 0;
        elevGoal = 0;
      }
      canvas.style.cursor = cursor("default");
      kick();
    };

    load();
    retheme();
    relayout();

    // start flat, morph to the chosen view once a third of it is on screen
    target = 0;
    const enter = () => {
      if (entered) return;
      entered = true;
      if (reduced) t = cfg.current.target;
      setTarget();
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          enter();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(stage);
    const io2 = new IntersectionObserver((entries) => {
      inView = entries.some((en) => en.isIntersecting);
      if (inView) kick();
    });
    io2.observe(stage);

    const ro = new ResizeObserver(() => {
      if (Math.round(stage.clientWidth) !== W) relayout();
    });
    ro.observe(stage);
    // the theme switch flips classes on <html>
    const stopTheme = watchTheme(retheme);
    const onReduce = () => {
      reduced = reduceMq.matches;
      kick();
    };
    reduceMq.addEventListener("change", onReduce);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("dblclick", onDbl);
    canvas.addEventListener("keydown", onKey);
    canvas.addEventListener("blur", onBlur);

    engineRef.current = {
      kick: () => {
        setTarget();
        kick();
      },
      load: () => {
        load();
        relayout();
        kick();
      },
      retheme,
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      io2.disconnect();
      ro.disconnect();
      stopTheme();
      reduceMq.removeEventListener("change", onReduce);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("dblclick", onDbl);
      canvas.removeEventListener("keydown", onKey);
      canvas.removeEventListener("blur", onBlur);
      engineRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    engineRef.current?.kick();
  }, [view, legendLevel]);
  React.useEffect(() => {
    engineRef.current?.load();
  }, [boxes]);
  React.useEffect(() => {
    engineRef.current?.retheme();
  }, [palette]);

  const is3d = view === "3d";

  return (
    <section
      ref={rootRef}
      className={`relative flex w-full flex-col rounded-xl border p-4 sm:p-6 ${className}`}
      style={{ background: BG, color: FG, borderColor: BORDER }}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="space-y-1">
          {title && <h3 className="m-0 text-base tracking-tight sm:text-lg">{title}</h3>}
          {hint && (
            <p className="text-xs" style={{ color: MUTED }}>
              {hint}
            </p>
          )}
        </div>
        <div
          role="group"
          aria-label={labels.view}
          className="relative inline-flex rounded-md border p-0.5"
          style={{ borderColor: BORDER }}
        >
          <span
            aria-hidden
            className="absolute top-0.5 bottom-0.5 left-0.5 w-8 rounded transition-transform duration-300"
            style={{
              background: FG,
              opacity: 0.1,
              transform: is3d ? "translateX(100%)" : "none",
              transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
            }}
          />
          {(["2d", "3d"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={v === "2d" ? labels.flat : labels.columns}
              title={v === "2d" ? labels.flat : labels.columns}
              onClick={() => {
                setView(v);
              }}
              className="relative z-10 grid h-7 w-8 cursor-pointer place-items-center rounded border-0 bg-transparent p-0"
              style={{ color: view === v ? FG : MUTED }}
            >
              {v === "2d" ? <HexIcon /> : <CubeIcon />}
            </button>
          ))}
        </div>
      </header>

      <div className="relative overflow-hidden rounded-lg border" style={{ borderColor: BORDER }}>
        <div className="relative px-2 pt-2 sm:px-4 sm:pt-4">
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-md outline-offset-4 has-[:focus-visible]:outline-2"
            style={{ height: 320 }}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              aria-label={typeof title === "string" ? title : undefined}
              className="absolute top-0 left-0 block outline-none"
              style={{ touchAction: is3d && orbit ? "pan-y" : "auto" }}
            />
          </div>
          <div
            ref={tipRef}
            aria-hidden
            className="pointer-events-none absolute top-3 left-3 z-30 rounded-md px-3 py-1.5 text-xs whitespace-nowrap shadow-xl transition-opacity duration-150 motion-reduce:transition-none sm:top-4 sm:left-4"
            style={{ opacity: 0, background: FG, color: BG }}
          >
            <strong ref={tipBRef} className="block font-semibold" />
            <span ref={tipSRef} className="block text-[11px] opacity-80" />
            <span
              aria-hidden
              className="absolute top-full h-0 w-0"
              style={{
                left: "var(--arrow, 50%)",
                marginLeft: -5,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `5px solid ${FG}`,
              }}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-3 py-3 text-xs sm:px-4"
          style={{ color: MUTED }}
        >
          <span>{labels.hint}</span>
          <div
            className="flex items-center gap-1.5"
            onMouseLeave={() => {
              setLegendLevel(-1);
            }}
          >
            <span className="text-[11px]">{labels.less}</span>
            {swatches.map((c, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={legendLevel === i}
                aria-label={labels.levels[i]}
                title={labels.levels[i]}
                onMouseEnter={() => {
                  setLegendLevel(i);
                }}
                onFocus={() => {
                  setLegendLevel(i);
                }}
                onBlur={() => {
                  setLegendLevel(-1);
                }}
                onClick={() => {
                  setLegendLevel((cur) => (cur === i ? -1 : i));
                }}
                className="size-3 cursor-pointer rounded-xs border-0 p-0 transition-transform duration-200 hover:scale-125"
                style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
              />
            ))}
            <span className="text-[11px]">{labels.more}</span>
          </div>
        </div>
      </div>
      {footer && (
        <p className="mt-3 text-[11px]" style={{ color: MUTED }}>
          {footer}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
