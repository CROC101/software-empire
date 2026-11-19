"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotionAfterMount } from "./use-reduced-motion";

/**
 * One animation clock for every canvas effect on the page. Many effects at once stay smooth because:
 * - one requestAnimationFrame drives them all (no N loops fighting for the frame);
 * - an effect off screen is dropped from the loop, so only what you see costs anything;
 * - Canvas 2D only, so no WebGL context limit (Chrome drops contexts past ~16);
 * - when frames get slow the whole page renders at a lower pixel ratio, and climbs back when fast;
 * - field effects draw at a fraction of the size (`res`) and the browser scales them up.
 * Under reduced motion each effect draws one still frame and never joins the loop.
 */

export type FxSize = {
  /** CSS pixels */
  w: number;
  h: number;
  /** backing pixels (`w * k`) */
  pw: number;
  ph: number;
  /** backing pixels per CSS pixel; the context is already scaled by it */
  k: number;
  /** pointer in CSS pixels, `on` while it is over the effect */
  pointer: { x: number; y: number; on: boolean; down: number };
};
export type FxScene = {
  /** after every size change (seed particles here) */
  resize?: () => void;
  /** t and dt in seconds; t only runs while the effect is on screen */
  draw: (t: number, dt: number) => void;
};
export type FxMaker = (ctx: CanvasRenderingContext2D, s: FxSize) => FxScene;

type Job = { tick: (dt: number) => void; refit: () => void; visible: boolean };

const QUALITY = [1, 0.75, 0.5] as const;
const jobs = new Set<Job>();
let raf = 0;
let last = 0;
let ema = 1000 / 60;
let level = 0;
let slow = 0;
let fast = 0;

function loop(now: number) {
  const ms = last ? now - last : 1000 / 60;
  last = now;
  // a hidden tab or a long pause is not a slow frame
  if (ms < 100) {
    ema += (ms - ema) * 0.05;
    slow = ema > 22 ? slow + 1 : 0;
    fast = ema < 13 ? fast + 1 : 0;
    if (slow > 30 && level < QUALITY.length - 1) shift(1);
    else if (fast > 180 && level > 0) shift(-1);
  }
  const dt = Math.min(ms, 50) / 1000;
  let live = 0;
  for (const j of jobs)
    if (j.visible) {
      j.tick(dt);
      live++;
    }
  raf = live ? requestAnimationFrame(loop) : 0;
  if (!raf) last = 0;
}

function shift(by: number) {
  level += by;
  slow = fast = 0;
  for (const j of jobs) j.refit();
}

function wake() {
  if (!raf) raf = requestAnimationFrame(loop);
}

/** Live numbers for a benchmark readout: frames per second, effects running, pixel-ratio scale. */
export function fxStats() {
  let live = 0;
  for (const j of jobs) if (j.visible) live++;
  return { fps: Math.round(1000 / ema), live, total: jobs.size, quality: QUALITY[level] ?? 1 };
}

/** "#rrggbb" (what `useTokenColors` gives) -> [r, g, b] for pixel maths */
export function fxRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1, 7), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 256 colours blended evenly through `stops` ("#rrggbb"), as r,g,b triples, for field effects */
export function fxRamp(stops: readonly string[]): Uint8ClampedArray {
  const rgb = stops.map(fxRgb);
  const out = new Uint8ClampedArray(256 * 3);
  const span = Math.max(1, rgb.length - 1);
  for (let i = 0; i < 256; i++) {
    const p = (i / 255) * span;
    const a = rgb[Math.min(span, Math.floor(p))] ?? [0, 0, 0];
    const b = rgb[Math.min(span, Math.floor(p) + 1)] ?? a;
    const f = p - Math.floor(p);
    for (let ch = 0; ch < 3; ch++) {
      const from = a[ch] ?? 0;
      out[i * 3 + ch] = from + ((b[ch] ?? 0) - from) * f;
    }
  }
  return out;
}

/**
 * Runs a canvas effect on the shared clock. `make` builds the scene once per context (and again when
 * a dep changes); pass `null` while colours are still loading. `res` < 1 draws at that fraction of
 * the CSS size, for per-pixel fields.
 */
export function useFx(
  ref: RefObject<HTMLCanvasElement | null>,
  make: FxMaker | null,
  deps: readonly unknown[],
  { res = 0, pointer = false }: { res?: number; pointer?: boolean } = {},
) {
  const still = useReducedMotionAfterMount();
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d", { alpha: true });
    if (!c || !ctx || !make) return;
    const s: FxSize = {
      w: 0,
      h: 0,
      pw: 1,
      ph: 1,
      k: 1,
      pointer: { x: 0, y: 0, on: false, down: -1 },
    };
    const scene = make(ctx, s);
    let t = 0;
    let sized = false;

    const refit = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * (QUALITY[level] ?? 1);
      s.k = res > 0 ? res : dpr;
      Object.assign(s, {
        w,
        h,
        pw: Math.max(1, Math.round(w * s.k)),
        ph: Math.max(1, Math.round(h * s.k)),
      });
      c.width = s.pw;
      c.height = s.ph;
      ctx.setTransform(s.k, 0, 0, s.k, 0, 0);
      sized = true;
      scene.resize?.();
      if (still || !job.visible) scene.draw(t, 0);
    };
    const job: Job = {
      visible: false,
      refit,
      tick: (dt) => {
        if (!sized) return;
        t += dt;
        scene.draw(t, dt);
        // 0 on the first frame after a press, so scenes can react once
        if (s.pointer.down >= 0) s.pointer.down += dt;
      },
    };

    const size = new ResizeObserver(refit);
    size.observe(c);
    const seen = new IntersectionObserver(([e]) => {
      job.visible = !!e?.isIntersecting;
      if (job.visible && !still) wake();
    });
    if (!still) {
      jobs.add(job);
      seen.observe(c);
    }

    const host = c.parentElement;
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      Object.assign(s.pointer, { x: e.clientX - r.left, y: e.clientY - r.top, on: true });
    };
    const leave = () => {
      s.pointer.on = false;
    };
    const down = (e: PointerEvent) => {
      move(e);
      s.pointer.down = 0;
    };
    if (pointer && host) {
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerdown", down);
      host.addEventListener("pointerleave", leave);
    }
    return () => {
      jobs.delete(job);
      size.disconnect();
      seen.disconnect();
      host?.removeEventListener("pointermove", move);
      host?.removeEventListener("pointerdown", down);
      host?.removeEventListener("pointerleave", leave);
    };
    // deps are the caller's; make/ref are rebuilt with them
  }, [...deps, still, res, pointer]);
}
