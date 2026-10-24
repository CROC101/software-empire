"use client";

// Murmuration Wordmark, by Kedhareswer Naidu (21st.dev/@kedhareswer, MIT), vendored with the
// strict-lint fixes this repo needs and one behaviour change: the frame loop stops (instead of
// spinning idle) while the sky is off screen. Flock, sky and formation logic are the original.
//
// Thousands of starlings over a dusk sky. The flock rolls and folds like a real murmuration,
// driven by a slow curl-noise current and a wandering centre of gravity; every few seconds it
// converges, bird by bird, into your word, holds it, and scatters again. The pointer is a hawk:
// the flock tears open around it and closes behind. One 2D canvas; every bird is two strokes
// batched into a single path per frame. Nothing is fetched.

import * as React from "react";

export interface MurmurationPalette {
  skyTop: string;
  skyLow: string;
  sun: string;
  /** Birds and the reed line. */
  ink: string;
}

export type MurmurationPreset = "dusk" | "dawn" | "paper" | "night";

export interface MurmurationWordmarkProps {
  /** The word the flock forms. Short and bold reads best. */
  word?: string;
  /** How many starlings. Scaled down on small screens. */
  birds?: number;
  preset?: MurmurationPreset;
  /** Colour overrides (#rgb / #rrggbb), merged over the preset. */
  palette?: Partial<MurmurationPalette>;
  /** Seconds the flock flies free between formations. */
  flyFor?: number;
  /** Seconds the word holds once formed. */
  holdFor?: number;
  reeds?: boolean;
  /** The pointer is a hawk the flock flees. */
  interactive?: boolean;
  /** Font families the word is sampled from (canvas font syntax, no CSS variables). */
  fontFamily?: string;
  /** Content laid over the sky. */
  children?: React.ReactNode;
  /** Root height. A definite length, never a percentage. */
  height?: string;
  className?: string;
}

const PRESETS: Record<MurmurationPreset, MurmurationPalette> = {
  dusk: { skyTop: "#1d2b44", skyLow: "#e89a6a", sun: "#ffd2a0", ink: "#14100f" },
  dawn: { skyTop: "#9fb4c9", skyLow: "#f3d6c2", sun: "#fff3df", ink: "#1f2329" },
  paper: { skyTop: "#efe9dd", skyLow: "#e6ddcc", sun: "#ffffff", ink: "#1a1714" },
  night: { skyTop: "#05070d", skyLow: "#1a2236", sun: "#4a5d86", ink: "#dfe6f5" },
};

const SANS_STACK = '"Inter Tight", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';

// #region flock
export function mmwRandom(seed: number) {
  let a = seed >>> 0 || 1;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Divergence-free current at (x, y) at time t (the curl of travelling waves): folds, never piles. */
export function mmwCurl(x: number, y: number, t: number): [number, number] {
  const a = 1.7 * x + t;
  const b = 1.3 * y - 0.6 * t;
  const c = 2.9 * y + 1.1 * x - 0.8 * t;
  const d = 4.3 * x - 3.7 * y + 1.3 * t;
  const dpdx = 1.7 * Math.cos(a) * Math.cos(b) + 0.6 * 1.1 * Math.cos(c) - 0.35 * 4.3 * Math.sin(d);
  const dpdy =
    -1.3 * Math.sin(a) * Math.sin(b) + 0.6 * 2.9 * Math.cos(c) + 0.35 * 3.7 * Math.sin(d);
  return [dpdy, -dpdx];
}

/** The flock's wandering centre in unit space. */
export function mmwCentre(t: number): [number, number] {
  return [
    0.42 * Math.sin(t * 0.21) + 0.12 * Math.sin(t * 0.53 + 1),
    0.16 * Math.sin(t * 0.33 + 2) - 0.08,
  ];
}

export function mmwEase(k: number) {
  const x = k < 0 ? 0 : k > 1 ? 1 : k;
  return x * x * (3 - 2 * x);
}

/** Pair every bird with a target point, shuffled so the word fills in from everywhere at once. */
export function mmwAssign(birds: number, points: number, seed: number) {
  const out = new Int32Array(birds);
  if (points <= 0) return out.fill(-1);
  const order = new Int32Array(points);
  for (let i = 0; i < points; i++) order[i] = i;
  const rand = mmwRandom(seed);
  for (let i = points - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i] ?? 0;
    order[i] = order[j] ?? 0;
    order[j] = tmp;
  }
  for (let i = 0; i < birds; i++) out[i] = order[i % points] ?? 0;
  return out;
}

/** A colour at an alpha, for #rgb / #rrggbb; anything else is returned as-is. */
export function mmwAlpha(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const g = m?.[1];
  if (!g) return hex;
  const h = g.length === 3 ? g.replace(/./g, "$&$&") : g;
  return `rgba(${String(parseInt(h.slice(0, 2), 16))},${String(parseInt(h.slice(2, 4), 16))},${String(parseInt(h.slice(4, 6), 16))},${String(alpha)})`;
}
// #endregion

const MMW_CSS = `
.mmw-root { position: relative; width: 100%; overflow: hidden; isolation: isolate; background: var(--mmw-sky); }
.mmw-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.mmw-over { position: relative; z-index: 1; height: 100%; pointer-events: none; }
.mmw-over [data-interactive], .mmw-over a, .mmw-over button { pointer-events: auto; }
.mmw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

export function MurmurationWordmark({
  word = "flock",
  birds = 4200,
  preset = "dusk",
  palette,
  flyFor = 7,
  holdFor = 3.2,
  reeds = true,
  interactive = true,
  fontFamily = SANS_STACK,
  children,
  height = "100svh",
  className = "",
}: MurmurationWordmarkProps) {
  const colors: MurmurationPalette = { ...PRESETS[preset], ...palette };
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const opts = React.useRef({ flyFor, holdFor, interactive });
  React.useLayoutEffect(() => {
    opts.current = { flyFor, holdFor, interactive };
  });
  const { skyTop, skyLow, sun: sunColor, ink } = colors;

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 1;
    let h = 1;
    let dpr = 1;
    let n = 0;
    let raf = 0;
    let visible = false;
    let sky: HTMLCanvasElement | null = null;
    // per bird: position, velocity (px), depth, wing phase, target index
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let depth = new Float32Array(0);
    let phase = new Float32Array(0);
    let target = new Int32Array(0);
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let hx = -1e5;
    let hy = -1e5;
    let last = performance.now();
    let clock = 0;
    const rand = mmwRandom(11);

    const layout = () => {
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // sky: a vertical gradient, the sun's glow low on the horizon, grain
      sky = document.createElement("canvas");
      sky.width = canvas.width;
      sky.height = canvas.height;
      const s = sky.getContext("2d");
      if (s) {
        s.setTransform(dpr, 0, 0, dpr, 0, 0);
        const g = s.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, skyTop);
        g.addColorStop(0.78, skyLow);
        g.addColorStop(1, skyLow);
        s.fillStyle = g;
        s.fillRect(0, 0, w, h);
        const sun = s.createRadialGradient(
          w * 0.62,
          h * 0.86,
          0,
          w * 0.62,
          h * 0.86,
          Math.max(w, h) * 0.55,
        );
        sun.addColorStop(0, sunColor);
        sun.addColorStop(0.25, mmwAlpha(sunColor, 0.5));
        sun.addColorStop(1, mmwAlpha(sunColor, 0));
        s.globalAlpha = 0.55;
        s.fillStyle = sun;
        s.fillRect(0, 0, w, h);
        s.globalAlpha = 1;
        const gr = mmwRandom(5);
        for (let i = 0; i < (w * h) / 10; i++) {
          s.fillStyle = gr() < 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.035)";
          s.fillRect(gr() * w, gr() * h, 1, 1);
        }
        if (reeds) {
          // a reed bed along the bottom, stalks leaning with a wind
          s.strokeStyle = ink;
          s.fillStyle = ink;
          const base = h - Math.max(6, h * 0.012);
          s.fillRect(0, base, w, h - base);
          for (let x = -10; x < w + 10; x += 2 + gr() * 9) {
            if (gr() < 0.18) x += gr() * 30;
            const tall = Math.pow(gr(), 1.6) * Math.max(34, h * 0.13) + 6;
            const lean = (gr() - 0.3) * 10;
            s.lineWidth = 0.6 + gr() * 1.2;
            s.beginPath();
            s.moveTo(x, base + 2);
            s.quadraticCurveTo(x + lean * 0.3, base - tall * 0.6, x + lean, base - tall);
            s.stroke();
            if (gr() < 0.07) {
              s.beginPath();
              s.ellipse(x + lean, base - tall - 4, 1.8, 6, lean * 0.04, 0, Math.PI * 2);
              s.fill();
            }
          }
        }
      }

      // the word, sampled into points on a 1x mask
      const m = document.createElement("canvas");
      m.width = w;
      m.height = h;
      const mc = m.getContext("2d", { willReadFrequently: true });
      const xs: number[] = [];
      const ys: number[] = [];
      if (mc) {
        mc.font = `900 100px ${fontFamily}`;
        const wordW = mc.measureText(word || " ").width || 1;
        const size = Math.min(((w * 0.74) / wordW) * 100, (h * 0.4) / 0.72);
        mc.font = `900 ${String(size)}px ${fontFamily}`;
        mc.textAlign = "center";
        mc.textBaseline = "middle";
        mc.fillText(word || " ", w / 2, h * 0.44);
        const img = mc.getImageData(0, 0, w, h).data;
        const step = Math.max(2, Math.round(Math.sqrt((w * h) / 90000)));
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            if ((img[(y * w + x) * 4 + 3] ?? 0) > 128) {
              xs.push(x + (rand() - 0.5) * step);
              ys.push(y + (rand() - 0.5) * step);
            }
          }
        }
      }
      tx = new Float32Array(xs);
      ty = new Float32Array(ys);

      // scale the flock to the screen, then seed it as a loose cloud
      const want = Math.round(
        Math.max(600, Math.min(9000, birds)) * Math.min(1, (w * h) / (1440 * 860)),
      );
      if (want !== n) {
        n = Math.max(500, want);
        px = new Float32Array(n);
        py = new Float32Array(n);
        vx = new Float32Array(n);
        vy = new Float32Array(n);
        depth = new Float32Array(n);
        phase = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const a = rand() * Math.PI * 2;
          const r = Math.sqrt(rand());
          px[i] = w * 0.5 + Math.cos(a) * r * w * 0.22;
          py[i] = h * 0.4 + Math.sin(a) * r * h * 0.16;
          depth[i] = 0.55 + rand() * 0.45;
          phase[i] = rand() * Math.PI * 2;
        }
      }
      target = mmwAssign(n, tx.length, 23);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      raf = requestAnimationFrame(frame);
      // reduced motion: the flock is drawn but never moves
      const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const o = opts.current;
      const fly = Math.max(1, o.flyFor);
      const hold = Math.max(0.5, o.holdFor);
      const cycle = fly + 2.4 + hold + 0.6;
      const tc = clock % cycle;
      // 0 → 1 while forming, 1 while holding, back to 0 on release
      let pull = 0;
      if (tc > fly && tc <= fly + 2.4) pull = mmwEase((tc - fly) / 2.4);
      else if (tc > fly + 2.4 && tc <= fly + 2.4 + hold) pull = 1;
      else if (tc > fly + 2.4 + hold) pull = 1 - mmwEase((tc - fly - 2.4 - hold) / 0.6);

      const u = Math.min(w, h);
      const cen = mmwCentre(clock);
      const cxp = w / 2 + cen[0] * w * 0.5;
      const cyp = h * 0.42 + cen[1] * h;
      const t = clock * 0.35;
      const hawk = o.interactive && hx > -1e4;
      const hawkR = u * 0.16;
      const free = 1 - pull;

      for (let i = 0; i < n; i++) {
        const x = px[i] ?? 0;
        const y = py[i] ?? 0;
        const di = depth[i] ?? 1;
        const ivx = vx[i] ?? 0;
        const ivy = vy[i] ?? 0;
        let ax = 0;
        let ay = 0;
        // free flight: the current folds the flock, the centre holds it together
        const cv = mmwCurl(((x - w / 2) / u) * 2.2 + di * 0.25, ((y - h / 2) / u) * 2.2, t);
        ax += cv[0] * 420 * free;
        ay += cv[1] * 420 * free;
        const dxC = cxp - x;
        const dyC = (cyp - y) * 1.6;
        const dC = Math.hypot(dxC, dyC) / u;
        const keep = dC < 0.14 ? 0.15 : 0.15 + (dC - 0.14) * 6;
        ax += dxC * keep * 2.2 * free;
        ay += dyC * keep * 1.6 * free;
        // formation: spring to the bird's point in the word
        const ti = target[i] ?? -1;
        if (pull > 0 && ti >= 0) {
          ax += ((tx[ti] ?? x) - x) * 9 * pull - ivx * 3.2 * pull;
          ay += ((ty[ti] ?? y) - y) * 9 * pull - ivy * 3.2 * pull;
        }
        // the hawk: a hard shove away inside its radius
        if (hawk) {
          const dx = x - hx;
          const dy = y - hy;
          const d2 = dx * dx + dy * dy;
          if (d2 < hawkR * hawkR) {
            const d = Math.sqrt(d2) + 0.01;
            const f = (1 - d / hawkR) * 5200;
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
        }
        let nvx = (ivx + ax * dt) * (1 - 1.1 * dt);
        let nvy = (ivy + ay * dt) * (1 - 1.1 * dt);
        const sp = Math.hypot(nvx, nvy);
        const cap = 520 + 380 * pull;
        if (sp > cap) {
          nvx = (nvx / sp) * cap;
          nvy = (nvy / sp) * cap;
        }
        vx[i] = nvx;
        vy[i] = nvy;
        px[i] = x + nvx * dt;
        py[i] = y + nvy * dt;
        phase[i] = (phase[i] ?? 0) + dt * (9 + sp * 0.02);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (sky) ctx.drawImage(sky, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // two depth passes so near birds read darker and heavier
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const di = depth[i] ?? 1;
          if ((pass === 1) !== di > 0.78) continue;
          const s = (1.6 + di * 2.2) * (1 - 0.35 * pull);
          const ivx = vx[i] ?? 0;
          const ivy = vy[i] ?? 0;
          const sp = Math.hypot(ivx, ivy) + 0.001;
          const dx = ivx / sp;
          const dy = ivy / sp;
          const flap = 0.55 + 0.45 * Math.sin(phase[i] ?? 0);
          const bx = px[i] ?? 0;
          const by = py[i] ?? 0;
          // a "v": two wings swept back from the body, opening and closing
          const wx = -dx * s;
          const wy = -dy * s;
          const nx = -dy * s * flap;
          const ny = dx * s * flap;
          ctx.moveTo(bx + wx + nx, by + wy + ny);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + wx - nx, by + wy - ny);
        }
        ctx.strokeStyle = ink;
        ctx.globalAlpha = pass === 0 ? 0.55 : 0.92;
        ctx.lineWidth = pass === 0 ? 0.9 : 1.25;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const start = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const onMove = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      hx = e.clientX - b.left;
      hy = e.clientY - b.top;
    };
    const onLeave = () => {
      hx = -1e5;
      hy = -1e5;
    };

    layout();
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => layout());
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      start();
    });
    io.observe(root);
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) layout();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [word, birds, skyTop, skyLow, sunColor, ink, reeds, fontFamily]);

  return (
    <div
      ref={rootRef}
      className={`mmw-root ${className}`}
      style={{ height, "--mmw-sky": skyTop } as React.CSSProperties}
    >
      <style>{MMW_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="mmw-sr">{word}</span>
      {children ? <div className="mmw-over">{children}</div> : null}
    </div>
  );
}
