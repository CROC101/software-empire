"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { watchTheme } from "../lib/token-colors";

/**
 * Circularium ring: a 24-hour circadian activity ring. Seven concentric rings (Monday innermost)
 * across 24 hourly sectors (midnight at the top), each sector extruded by its value into a 3D
 * ring histogram or laid flat as a radial heatmap. Smooth 2D ↔ 3D morph, drag to orbit in 3D
 * (double-click resets), day filter, summary badges, hover / tap / keyboard tooltips, legend
 * that highlights one level. Canvas 2D, DPR aware, sleeps when idle or off screen; follows the
 * page theme (html.dark) and reduced motion.
 *
 * Vendored from 21st.dev ("circularium-ring"): wording and units are props (days, tip text,
 * level names, labels), palette tokens, house classes instead of neutral-*, strict-lint fixes.
 */

type RGB = [number, number, number];

const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const easeInOutCubic = (x: number): number => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const luminance = (c: RGB): number => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const rgbString = (r: number, g: number, b: number) =>
  `rgb(${String(Math.round(r))},${String(Math.round(g))},${String(Math.round(b))})`;

const WAVE = 0.42;
const riseAt = (t: number, order: number): number => easeOutCubic((t - order * 0.36) / (1 - WAVE));

const YAW_3D = Math.PI / 4;
const ELEV_3D = (34 * Math.PI) / 180;
const YAW_RANGE: [number, number] = [(8 * Math.PI) / 180, (82 * Math.PI) / 180];
const ELEV_RANGE: [number, number] = [(18 * Math.PI) / 180, (62 * Math.PI) / 180];

type Cam = { cs: number; sn: number; se: number; ce: number };

const camera = (e: number, dYaw = 0, dElev = 0): Cam => {
  const yaw = Math.min(YAW_RANGE[1], Math.max(0, lerp(0, YAW_3D + dYaw, e)));
  const elev = lerp(
    Math.PI / 2,
    Math.min(ELEV_RANGE[1], Math.max(ELEV_RANGE[0], ELEV_3D + dElev)),
    e,
  );
  return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) };
};

const project = (c: Cam, x: number, y: number, z: number): [number, number] => [
  x * c.cs - y * c.sn,
  (x * c.sn + y * c.cs) * c.se - z * c.ce,
];

const pad2 = (n: number) => String(n).padStart(2, "0");
const at = (a: Float32Array, i: number) => a[i] ?? 0;

const sector = (r0: number, r1: number, a0: number, a1: number, gap = 0.035): number[] => {
  const p = a0 + gap;
  const q = a1 - gap;
  return [
    Math.cos(p) * r0,
    Math.sin(p) * r0,
    Math.cos(p) * r1,
    Math.sin(p) * r1,
    Math.cos(q) * r1,
    Math.sin(q) * r1,
    Math.cos(q) * r0,
    Math.sin(q) * r0,
  ];
};

const pointInQuad = (p: Float32Array, o: number, x: number, y: number): boolean => {
  let sign = 0;
  for (let k = 0; k < 4; k++) {
    const ax = at(p, o + k * 2);
    const ay = at(p, o + k * 2 + 1);
    const bx = at(p, o + ((k + 1) % 4) * 2);
    const by = at(p, o + ((k + 1) % 4) * 2 + 1);
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return sign !== 0;
};

const quadPath = (ctx: CanvasRenderingContext2D, p: Float32Array, o: number, r: number) => {
  if (r < 0.3) {
    ctx.moveTo(at(p, o), at(p, o + 1));
    ctx.lineTo(at(p, o + 2), at(p, o + 3));
    ctx.lineTo(at(p, o + 4), at(p, o + 5));
    ctx.lineTo(at(p, o + 6), at(p, o + 7));
    ctx.closePath();
    return;
  }
  ctx.moveTo((at(p, o + 6) + at(p, o)) / 2, (at(p, o + 7) + at(p, o + 1)) / 2);
  for (let k = 0; k < 4; k++) {
    const b = (k + 1) % 4;
    ctx.arcTo(at(p, o + k * 2), at(p, o + k * 2 + 1), at(p, o + b * 2), at(p, o + b * 2 + 1), r);
  }
  ctx.closePath();
};

let colorProbe: CanvasRenderingContext2D | null = null;
const toRGB = (color: string, fallback: RGB): RGB => {
  if (typeof document === "undefined") return fallback;
  if (!colorProbe) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    colorProbe = c.getContext("2d", { willReadFrequently: true });
  }
  if (!colorProbe) return fallback;
  try {
    colorProbe.clearRect(0, 0, 1, 1);
    colorProbe.fillStyle = "rgba(0,0,0,0)";
    colorProbe.fillStyle = color;
    colorProbe.fillRect(0, 0, 1, 1);
    const d = colorProbe.getImageData(0, 0, 1, 1).data;
    if ((d[3] ?? 0) < 8) return fallback;
    return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
  } catch {
    return fallback;
  }
};

interface RingBox {
  pts: number[]; // 4 footprint vertices
  h: number; // top elevation
  lv: number; // colour level 0..4
  order: number; // morph phase 0..1
  tip: [string, string]; // title, detail
}

export type RingView = "2d" | "3d";
type DayFilter = "all" | "weekdays" | "weekend";

export interface CirculariumRingProps {
  /** 7 rows (Mon→Sun) × 24 hourly values. */
  data: number[][];
  /** Day names, Monday first. */
  days: readonly string[];
  /** Tooltip detail for one sector, e.g. (value) => `${value} commits`. */
  formatValue: (value: number) => string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hint?: React.ReactNode;
  /** 4 colours (light → strong) for the light and the dark theme. */
  palette: { light: string[]; dark: string[] };
  defaultView?: RingView;
  orbit?: boolean;
  /** Five level names, lowest first, for the legend. */
  levelNames?: [string, string, string, string, string];
  legendLabels?: [string, string];
  labels?: {
    filter?: string;
    all?: string;
    weekdays?: string;
    weekend?: string;
    view?: string;
    flat?: string;
    ring?: string;
    canvas?: string;
    total?: string;
    peak?: string;
    best?: string;
  };
  /** Summary badges: total, busiest hour, busiest day. */
  showMetrics?: boolean;
  className?: string;
}

export function CirculariumRing({
  data,
  days,
  formatValue,
  title,
  subtitle,
  hint,
  palette,
  defaultView = "3d",
  orbit = true,
  levelNames = ["0", "1", "2", "3", "4"],
  legendLabels = ["น้อย", "มาก"],
  labels = {},
  showMetrics = true,
  className,
}: CirculariumRingProps) {
  const [view, setView] = React.useState<RingView>(defaultView);
  const [filter, setFilter] = React.useState<DayFilter>("all");
  const [swatches, setSwatches] = React.useState<string[]>([]);
  const [legendLevel, setLegendLevel] = React.useState(-1);
  const [announce, setAnnounce] = React.useState("");

  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const tipBRef = React.useRef<HTMLElement>(null);
  const tipSRef = React.useRef<HTMLSpanElement>(null);

  const max = React.useMemo(() => Math.max(1, ...data.flat()), [data]);

  const metrics = React.useMemo(() => {
    let total = 0;
    const dayTotals = Array.from({ length: 7 }, () => 0);
    const hourTotals = Array.from({ length: 24 }, () => 0);
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = data[d]?.[h] ?? 0;
        total += v;
        dayTotals[d] = (dayTotals[d] ?? 0) + v;
        hourTotals[h] = (hourTotals[h] ?? 0) + v;
      }
    }
    const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
    const bestDay = dayTotals.indexOf(Math.max(...dayTotals));
    return {
      total,
      peak: `${pad2(peakHour)}:00–${pad2((peakHour + 1) % 24)}:00`,
      best: days[bestDay] ?? "",
    };
  }, [data, days]);

  const spec = React.useMemo(() => {
    const boxes: RingBox[] = [];
    for (let d = 0; d < 7; d++) {
      const weekday = d < 5;
      const shown =
        filter === "all" ||
        (filter === "weekdays" && weekday) ||
        (filter === "weekend" && !weekday);
      for (let h = 0; h < 24; h++) {
        const v = data[d]?.[h] ?? 0;
        const a0 = -Math.PI / 2 + (h / 24) * Math.PI * 2;
        const r0 = 3.2 + d * 1.05;
        boxes.push({
          pts: sector(r0, r0 + 0.95, a0, a0 + Math.PI / 12),
          h: shown ? 0.25 + (v / max) * 6 : 0.08,
          lv: shown ? (v / max) * 4 : 0.15,
          order: h / 24,
          tip: [`${days[d] ?? ""} ${pad2(h)}:00`, formatValue(v)],
        });
      }
    }
    const marks = [0, 6, 12, 18].map((h) => {
      const a = -Math.PI / 2 + ((h + 0.5) / 24) * Math.PI * 2;
      return { x: Math.cos(a) * 12.4, y: Math.sin(a) * 12.4, text: `${pad2(h)}:00` };
    });
    return { boxes, marks };
  }, [data, days, filter, formatValue, max]);

  // the latest props for the canvas loop, which lives outside React's render cycle
  const cfg = React.useRef({ spec, orbit, palette, legendLevel, target: view === "3d" ? 1 : 0 });
  React.useLayoutEffect(() => {
    cfg.current = { spec, orbit, palette, legendLevel, target: view === "3d" ? 1 : 0 };
  });

  const engineRef = React.useRef<{
    kick: () => void;
    load: () => void;
    retheme: () => void;
  } | null>(null);

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
    let Hmax = 0;
    let dpr = 1;
    let font = "10px sans-serif";

    const col = new Float32Array(15);
    const colGoal = new Float32Array(15);
    let colReady = false;
    let fg: RGB = [23, 23, 23];
    let bg: RGB = [255, 255, 255];

    let boxes: RingBox[] = [];
    let n = 0;
    let cp = new Float32Array(0);
    let cz = new Float32Array(0);
    let cl = new Float32Array(0);
    let dep = new Float32Array(0);
    let hover = new Float32Array(0);
    let dim = new Float32Array(0);
    let polys = new Float32Array(0);
    let sides = new Uint8Array(0);
    let vis = new Uint8Array(0);
    let order: number[] = [];

    let hovered = -1;
    let pinned = -1;
    let activeIdx = -1;
    let tipW = 0;
    let lastTip = "";
    let raf = 0;
    let last = 0;

    const load = () => {
      boxes = cfg.current.spec.boxes;
      const m = boxes.length;
      if (m !== n || cp.length !== m * 8) {
        n = m;
        cp = new Float32Array(m * 8);
        cz = new Float32Array(m);
        cl = new Float32Array(m);
        dep = new Float32Array(m);
        hover = new Float32Array(m);
        dim = new Float32Array(m);
        polys = new Float32Array(m * 40);
        sides = new Uint8Array(m);
        vis = new Uint8Array(m);
        order = Array.from({ length: m }, (_, i) => i);
        boxes.forEach((b, i) => {
          for (let j = 0; j < 8; j++) cp[i * 8 + j] = b.pts[j] ?? 0;
          cz[i] = b.h;
          cl[i] = b.lv;
        });
      }
      if (hovered >= n) hovered = -1;
      if (pinned >= n) pinned = -1;
      if (activeIdx >= n) {
        activeIdx = -1;
        tip.style.opacity = "0";
      }
    };

    const retheme = () => {
      const cs = getComputedStyle(root);
      const dark = document.documentElement.classList.contains("dark");
      fg = toRGB(cs.color, dark ? [240, 240, 240] : [23, 23, 23]);
      bg = toRGB(cs.backgroundColor, dark ? [20, 20, 20] : [255, 255, 255]);
      const isDark = dark || luminance(bg) < 0.45;
      font = "500 10px " + (cs.fontFamily || "sans-serif");
      const pal = isDark ? cfg.current.palette.dark : cfg.current.palette.light;
      const empty = mixRGB(bg, fg, isDark ? 0.12 : 0.08);
      const fallback: RGB = isDark ? [120, 200, 255] : [40, 140, 220];
      const all: RGB[] = [empty, ...[0, 1, 2, 3].map((i) => toRGB(pal[i] ?? "", fallback))];
      all.forEach((c, k) => {
        for (let ch = 0; ch < 3; ch++) colGoal[k * 3 + ch] = c[ch] ?? 0;
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
      const add = (x: number, y: number, z: number) => {
        const p = project(cam, x, y, z);
        minx = Math.min(minx, p[0]);
        maxx = Math.max(maxx, p[0]);
        miny = Math.min(miny, p[1]);
        maxy = Math.max(maxy, p[1]);
      };
      for (const b of boxes) {
        for (let k = 0; k < 4; k++) {
          const x = b.pts[k * 2] ?? 0;
          const y = b.pts[k * 2 + 1] ?? 0;
          add(x, y, 0);
          add(x, y, b.h * e);
        }
      }
      for (const l of cfg.current.spec.marks) add(l.x, l.y, 0);
      if (!isFinite(minx)) return { minx: 0, maxx: 1, miny: 0, maxy: 1 };
      return { minx, maxx, miny, maxy };
    };

    const relayout = () => {
      const w = Math.round(stage.clientWidth);
      if (!w || !n) return;
      W = w;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      // a viewport-bounded stage height, so the card never jumps
      const maxStage = Math.min(Math.round(window.innerHeight * 0.5), 380);
      const h = Math.max(260, Math.min(Math.round(W * 0.62), maxStage));
      Hmax = h;
      stage.style.height = `${String(h)}px`;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(Hmax * dpr);
      canvas.style.width = `${String(W)}px`;
      canvas.style.height = `${String(Hmax)}px`;
      draw();
    };

    const draw = () => {
      if (!W || !n) return;
      const e = easeInOutCubic(t);
      const cam = camera(e, yaw, elev);
      const bx = extent(cam, e);
      const pad = lerp(8, 20, e);
      const aw = W - pad * 2;
      const ah = Hmax - pad * 2;
      const bw = Math.max(1e-6, bx.maxx - bx.minx);
      const bh = Math.max(1e-6, bx.maxy - bx.miny);
      const s = Math.min(aw / bw, ah / bh);
      const ox = pad + (aw - bw * s) / 2 - bx.minx * s;
      const oy = pad + (ah - bh * s) / 2 - bx.miny * s;
      const { cs, sn, se, ce } = cam;
      const px = (x: number, y: number) => ox + (x * cs - y * sn) * s;
      const py = (x: number, y: number, z: number) => oy + ((x * sn + y * cs) * se - z * ce) * s;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hmax);

      // back to front
      for (let i = 0; i < n; i++) {
        const o = i * 8;
        dep[i] =
          ((at(cp, o) + at(cp, o + 2) + at(cp, o + 4) + at(cp, o + 6)) * sn +
            (at(cp, o + 1) + at(cp, o + 3) + at(cp, o + 5) + at(cp, o + 7)) * cs) /
          4;
      }
      order.sort((a, c) => at(dep, a) - at(dep, c));

      const rad = lerp(0.18, 0.04, e) * s;
      const outline = (1 - e) * 0.08;
      const lift = 0.65 * e;

      for (const i of order) {
        const b = boxes[i];
        if (!b) continue;
        if (at(cz, i) < 0.04) {
          vis[i] = 0;
          sides[i] = 0;
          continue;
        }
        vis[i] = 1;
        const o8 = i * 8;
        const o = i * 40;
        const rz = riseAt(t, b.order);
        const hv = at(hover, i);
        const zt = at(cz, i) * rz + hv * lift;

        let a2 = 0;
        for (let j = 0; j < 4; j++) {
          const jn = (j + 1) & 3;
          const x = at(cp, o8 + j * 2);
          const y = at(cp, o8 + j * 2 + 1);
          polys[o + j * 2] = px(x, y);
          polys[o + j * 2 + 1] = py(x, y, zt);
          a2 += x * at(cp, o8 + jn * 2 + 1) - at(cp, o8 + jn * 2) * y;
        }
        const sg = a2 >= 0 ? 1 : -1;
        const tall = zt * ce * s > 0.35;

        const lf = Math.max(0, Math.min(4, at(cl, i)));
        const k0 = Math.floor(lf);
        const k1 = Math.min(4, k0 + 1);
        const f = lf - k0;
        let r = at(col, k0 * 3) * (1 - f) + at(col, k1 * 3) * f;
        let g = at(col, k0 * 3 + 1) * (1 - f) + at(col, k1 * 3 + 1) * f;
        let bl = at(col, k0 * 3 + 2) * (1 - f) + at(col, k1 * 3 + 2) * f;

        const dd = at(dim, i);
        if (dd > 0.002) {
          r += (at(col, 0) - r) * 0.72 * dd;
          g += (at(col, 1) - g) * 0.72 * dd;
          bl += (at(col, 2) - bl) * 0.72 * dd;
        }
        if (hv > 0.002) {
          const m = 0.22 * hv;
          r += (fg[0] - r) * m;
          g += (fg[1] - g) * m;
          bl += (fg[2] - bl) * m;
        }

        let bits = 0;
        for (let j = 0; j < 4 && tall; j++) {
          const jn = (j + 1) & 3;
          const xa = at(cp, o8 + j * 2);
          const ya = at(cp, o8 + j * 2 + 1);
          const xb = at(cp, o8 + jn * 2);
          const yb = at(cp, o8 + jn * 2 + 1);
          const dx = xb - xa;
          const dy = yb - ya;
          const len = Math.hypot(dx, dy) || 1;
          const nx = (sg * dy) / len;
          const ny = (-sg * dx) / len;
          if (nx * sn + ny * cs <= 0.02) continue;
          bits |= 1 << j;
          const q = o + 8 + j * 8;
          polys[q] = px(xa, ya);
          polys[q + 1] = py(xa, ya, 0);
          polys[q + 2] = px(xb, yb);
          polys[q + 3] = py(xb, yb, 0);
          polys[q + 4] = at(polys, o + jn * 2);
          polys[q + 5] = at(polys, o + jn * 2 + 1);
          polys[q + 6] = at(polys, o + j * 2);
          polys[q + 7] = at(polys, o + j * 2 + 1);
          const sh = Math.max(0.48, Math.min(0.96, 0.74 - 0.16 * (nx * cs - ny * sn)));
          ctx.beginPath();
          quadPath(ctx, polys, q, 0);
          ctx.fillStyle = rgbString(r * sh, g * sh, bl * sh);
          ctx.fill();
        }
        sides[i] = bits;

        ctx.beginPath();
        quadPath(ctx, polys, o, rad);
        ctx.fillStyle = rgbString(r, g, bl);
        ctx.fill();
        if (outline > 0.004) {
          ctx.strokeStyle = `rgba(${String(fg[0])},${String(fg[1])},${String(fg[2])},${outline.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        if (hv > 0.02) {
          ctx.strokeStyle = `rgba(${String(fg[0])},${String(fg[1])},${String(fg[2])},${(0.88 * hv).toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
      }

      // hour marks on the ground
      const muted = mixRGB(bg, fg, 0.58);
      ctx.font = font;
      ctx.fillStyle = rgbString(muted[0], muted[1], muted[2]);
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const l of cfg.current.spec.marks) ctx.fillText(l.text, px(l.x, l.y), py(l.x, l.y, 0));

      // the tooltip rides the active sector
      const active = boxes[activeIdx];
      if (active && vis[activeIdx]) {
        const o = activeIdx * 40;
        const text = active.tip.join("\n");
        if (text !== lastTip) {
          lastTip = text;
          tipB.textContent = active.tip[0];
          tipS.textContent = active.tip[1];
          tipW = tip.offsetWidth;
        }
        const tx = (at(polys, o) + at(polys, o + 2) + at(polys, o + 4) + at(polys, o + 6)) / 4;
        const ty = Math.min(at(polys, o + 1), at(polys, o + 3), at(polys, o + 5), at(polys, o + 7));
        const half = tipW / 2;
        const cx = Math.min(W - half - 4, Math.max(half + 4, tx));
        tip.style.transform = `translate(${(cx - half).toFixed(1)}px,${(ty - 8).toFixed(1)}px) translateY(-100%)`;
        tip.style.setProperty("--arrow", `${(tx - cx + half).toFixed(1)}px`);
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

      const kh = reduced ? 1 : 1 - Math.exp(-dt * 9);
      const kv = reduced ? 1 : 1 - Math.exp(-dt * 16);
      const kd = reduced ? 1 : 1 - Math.exp(-dt * 10);
      const leg = cfg.current.legendLevel;

      boxes.forEach((b, i) => {
        const o = i * 8;
        for (let j = 0; j < 8; j++) {
          const goal = b.pts[j] ?? 0;
          const dd = goal - at(cp, o + j);
          if (Math.abs(dd) > 0.0005) {
            cp[o + j] = at(cp, o + j) + dd * kh;
            moving = true;
          } else cp[o + j] = goal;
        }
        const dz = b.h - at(cz, i);
        if (Math.abs(dz) > 0.002) {
          cz[i] = at(cz, i) + dz * kh;
          moving = true;
        } else cz[i] = b.h;
        const dl = b.lv - at(cl, i);
        if (Math.abs(dl) > 0.004) {
          cl[i] = at(cl, i) + dl * kh;
          moving = true;
        } else cl[i] = b.lv;
        const hg = i === activeIdx ? 1 : 0;
        const hc = at(hover, i);
        if (hc !== hg) {
          hover[i] = Math.abs(hg - hc) < 0.003 ? hg : hc + (hg - hc) * kv;
          moving = true;
        }
        const dg = leg >= 0 && Math.round(b.lv) !== leg ? 1 : 0;
        const dc = at(dim, i);
        if (dc !== dg) {
          dim[i] = Math.abs(dg - dc) < 0.003 ? dg : dc + (dg - dc) * kd;
          moving = true;
        }
      });

      draw();
      if (moving) raf = requestAnimationFrame(tick);
    };

    function kick() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    const refreshActive = () => {
      const next = hovered >= 0 ? hovered : pinned;
      if (next === activeIdx) return;
      activeIdx = next;
      lastTip = "";
      tip.style.opacity = next >= 0 ? "1" : "0";
      tip.setAttribute("aria-hidden", next >= 0 ? "false" : "true");
      kick();
    };

    const hit = (x: number, y: number): number => {
      for (let k = n - 1; k >= 0; k--) {
        const i = order[k] ?? -1;
        if (i < 0 || !vis[i]) continue;
        const o = i * 40;
        if (pointInQuad(polys, o, x, y)) return i;
        const bits = sides[i] ?? 0;
        for (let j = 0; j < 4; j++) {
          if (bits & (1 << j) && pointInQuad(polys, o + 8 + j * 8, x, y)) return i;
        }
      }
      return -1;
    };

    const local = (ev: PointerEvent | MouseEvent): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top];
    };

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
      if (can) {
        try {
          canvas.setPointerCapture(ev.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const onMove = (ev: PointerEvent) => {
      if (drag?.orbit && ev.pointerId === drag.id) {
        const dx = ev.clientX - drag.x;
        const dyy = ev.clientY - drag.y;
        if (drag.moved || Math.hypot(dx, dyy) > 4) {
          drag.moved = true;
          yawGoal = Math.min(
            YAW_RANGE[1] - YAW_3D,
            Math.max(YAW_RANGE[0] - YAW_3D, drag.yaw + dx * 0.006),
          );
          if (drag.mouse)
            elevGoal = Math.min(
              ELEV_RANGE[1] - ELEV_3D,
              Math.max(ELEV_RANGE[0] - ELEV_3D, drag.elev + dyy * 0.004),
            );
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
      canvas.style.cursor =
        cfg.current.orbit && target === 1 ? "grab" : i >= 0 ? "pointer" : "default";
    };

    const onUp = (ev: PointerEvent) => {
      if (drag?.id !== ev.pointerId) return;
      const wasMoved = drag.moved;
      drag = null;
      if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
      canvas.style.cursor = cfg.current.orbit && target === 1 ? "grab" : "default";
      if (wasMoved) return;
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
      if (drag) return;
      hovered = -1;
      refreshActive();
    };
    const onDbl = () => {
      yawGoal = 0;
      elevGoal = 0;
      kick();
    };

    const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape"];
    const onKey = (ev: KeyboardEvent) => {
      if (!KEYS.includes(ev.key) || !n) return;
      ev.preventDefault();
      if (ev.key === "Escape") {
        pinned = -1;
        hovered = -1;
        refreshActive();
        return;
      }
      let i = pinned >= 0 ? pinned : activeIdx >= 0 ? activeIdx : n - 1;
      if (pinned >= 0 || activeIdx >= 0) {
        if (ev.key === "ArrowLeft") i -= 1;
        if (ev.key === "ArrowRight") i += 1;
        if (ev.key === "ArrowUp") i -= 24;
        if (ev.key === "ArrowDown") i += 24;
        if (ev.key === "Home") i = 0;
        if (ev.key === "End") i = n - 1;
      }
      i = Math.max(0, Math.min(n - 1, i));
      pinned = i;
      hovered = -1;
      refreshActive();
      const b = boxes[i];
      if (b) setAnnounce(b.tip.join(", "));
    };
    const onBlur = () => {
      pinned = -1;
      refreshActive();
    };

    const setTarget = () => {
      const goal = cfg.current.target;
      if (!entered || goal === target) return;
      target = goal;
      if (goal === 0) {
        yawGoal = 0;
        elevGoal = 0;
      }
      canvas.style.cursor = cfg.current.orbit && target === 1 ? "grab" : "default";
      kick();
    };

    load();
    retheme();
    relayout();

    const enter = () => {
      if (entered) return;
      entered = true;
      if (reduced) t = cfg.current.target;
      // the ring rises the first time it is seen
      target = -1;
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
  }, [spec]);
  React.useEffect(() => {
    engineRef.current?.retheme();
  }, [palette]);

  const is3d = view === "3d";
  const seg = (on: boolean) =>
    cn(
      "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200",
      on
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <section
      ref={rootRef}
      className={cn(
        "relative flex w-full flex-col rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="space-y-1">
          {title && (
            <h3 className="m-0 text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
          )}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={labels.filter ?? "Filter days"}
            className="inline-flex rounded-lg border bg-muted/60 p-0.5"
          >
            {(
              [
                ["all", labels.all ?? "All"],
                ["weekdays", labels.weekdays ?? "Mon–Fri"],
                ["weekend", labels.weekend ?? "Sat–Sun"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => {
                  setFilter(id);
                }}
                className={seg(filter === id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label={labels.view ?? "View"}
            className="inline-flex rounded-lg border bg-muted/60 p-0.5"
          >
            {(["2d", "3d"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                }}
                className={seg(view === v)}
              >
                {v === "2d" ? (labels.flat ?? "2D") : (labels.ring ?? "3D")}
              </button>
            ))}
          </div>
        </div>
      </header>

      {showMetrics && (
        <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
          {(
            [
              [labels.total ?? "Total", String(metrics.total)],
              [labels.peak ?? "Peak hour", metrics.peak],
              [labels.best ?? "Best day", metrics.best],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              className="flex flex-col-reverse rounded-lg border bg-background/60 px-2 py-2"
            >
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="text-sm font-bold">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="relative overflow-hidden rounded-xl border bg-background/40">
        <div className="relative px-2 pt-2 sm:px-4 sm:pt-4">
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-lg outline-offset-4 has-[:focus-visible]:outline-2"
            style={{ height: 290 }}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="img"
              aria-label={labels.canvas ?? "Activity ring. Use the arrow keys to read each hour."}
              className="absolute top-0 left-0 block outline-none"
              style={{ maxWidth: "none", touchAction: is3d && orbit ? "pan-y" : "auto" }}
            />
          </div>
          <div
            ref={tipRef}
            role="tooltip"
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 z-30 rounded-lg bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background shadow-xl transition-opacity duration-150 motion-reduce:transition-none sm:top-4 sm:left-4"
            style={{ opacity: 0 }}
          >
            <strong ref={tipBRef} className="block font-semibold" />
            <span ref={tipSRef} className="block text-[11px] opacity-80" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-3 py-3 text-xs text-muted-foreground sm:px-4">
          {hint && <span>{hint}</span>}
          <div
            className="flex items-center gap-1.5"
            onMouseLeave={() => {
              setLegendLevel(-1);
            }}
          >
            <span className="text-[11px]">{legendLabels[0]}</span>
            {swatches.map((c, i) => (
              <button
                key={c + String(i)}
                type="button"
                aria-label={levelNames[i]}
                aria-pressed={legendLevel === i}
                title={levelNames[i]}
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
                  setLegendLevel((curr) => (curr === i ? -1 : i));
                }}
                className="size-3 cursor-pointer rounded-sm border-0 p-0 transition-transform duration-200 hover:scale-125"
                style={{ background: c, boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.15)" }}
              />
            ))}
            <span className="text-[11px]">{legendLabels[1]}</span>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
