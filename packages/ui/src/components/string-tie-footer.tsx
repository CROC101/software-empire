"use client";

import * as React from "react";

/*
 * String Tie Footer (21st.dev, MIT), vendored with the strict-lint fixes this repo needs.
 * Geometry, rope physics and look are the original; colours and fonts come in as props, so the
 * hub passes design tokens.
 *
 * A closing "thank you" footer built like a string-and-button envelope: a paper flap with deep
 * rounded corners over a dark body, two paper buttons with metal grommets on the seam, and a
 * cord wound round them in a figure eight. Scroll it into view and the cord winds itself shut;
 * once it's sealed the signature writes itself in. Click either button and the cord unwinds, the
 * flap folds back, and a note slides out with a mail link. The loose cord is a little rope: drag
 * it, or brush past it with the pointer.
 */

// #region string
// Pure: cord geometry, the rope step and the scroll maths.

export type Pt = { x: number; y: number };

/** A small deterministic hash → [0, 1), so every render lays the cord down the same way. */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const round = (v: number): number => Math.round(v * 100) / 100;

export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0);

const at0 = <T,>(arr: ArrayLike<T>, i: number): T => arr[i] as T;

export const polyLength = (pts: Pt[]): number => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = at0(pts, i - 1);
    const b = at0(pts, i);
    l += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return l;
};

/** Resamples a polyline into `n` equal-length segments (n + 1 points), first and last kept exactly. */
export const resample = (pts: Pt[], n: number): Pt[] => {
  const segs = Math.max(1, Math.floor(n) || 1);
  if (!pts.length) return [];
  const first = at0(pts, 0);
  if (pts.length === 1) return Array.from({ length: segs + 1 }, () => ({ ...first }));
  const total = polyLength(pts);
  const out: Pt[] = [{ ...first }];
  let j = 1;
  let acc = 0;
  const segLen = (k: number) => {
    const a = at0(pts, k - 1);
    const b = at0(pts, k);
    return Math.hypot(b.x - a.x, b.y - a.y);
  };
  for (let i = 1; i < segs; i++) {
    const want = (total * i) / segs;
    while (j < pts.length - 1 && acc + segLen(j) < want) {
      acc += segLen(j);
      j++;
    }
    const a = at0(pts, j - 1);
    const b = at0(pts, j);
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const t = Math.min(1, Math.max(0, (want - acc) / l));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  out.push({ ...at0(pts, pts.length - 1) });
  return out;
};

/**
 * The tied cord: anchored in the bottom grommet, once round it, up across the seam, round the
 * top grommet, down across (the strands cross at the middle), round the bottom again, up once
 * more, and half round the top, where the end tucks off to the upper right.
 */
export const tiePath = (top: Pt, bottom: Pt, rho: number, tail: number, step = 4): Pt[] => {
  const dx = bottom.x - top.x;
  const dy = bottom.y - top.y;
  const D = Math.hypot(dx, dy) || 1;
  const u = { x: dx / D, y: dy / D };
  const v = { x: u.y, y: -u.x };
  // Keep the cord clear of the grommets even when the buttons sit close together.
  const r = Math.max(1, Math.min(rho, D * 0.42));
  const at = (c: Pt, rad: number, th: number): Pt => ({
    x: c.x + rad * (Math.cos(th) * u.x + Math.sin(th) * v.x),
    y: c.y + rad * (Math.cos(th) * u.y + Math.sin(th) * v.y),
  });
  const pts: Pt[] = [{ ...bottom }];
  const last = () => at0(pts, pts.length - 1);
  const arc = (c: Pt, rad: number, a0: number, a1: number) => {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * rad) / step));
    for (let i = 1; i <= n; i++) pts.push(at(c, rad, a0 + ((a1 - a0) * i) / n));
  };
  const line = (b: Pt) => {
    const a = last();
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let i = 1; i <= n; i++)
      pts.push({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
  };
  // θ is measured from "away from the top button" (down the axis), positive to its right.
  const tan = (rad: number) => Math.acos(Math.min(1, rad / (D / 2)));
  const PI = Math.PI;
  const r1 = r;
  const r2 = r * 1.16;
  const a1 = tan(r1);
  const a2 = tan(r2);
  line(at(bottom, r1, -PI / 2));
  arc(bottom, r1, -PI / 2, PI - a1);
  line(at(top, r1, -a1));
  arc(top, r1, -a1, a1 - 2 * PI);
  line(at(bottom, r2, -PI + a2));
  arc(bottom, r2, -PI + a2, PI - a2);
  line(at(top, r2, -a2));
  arc(top, r2, -a2, -1.25 * PI);
  // the free end tucks off to the upper right
  const end = last();
  const out = at(top, r2 + tail * 0.5, -1.32 * PI);
  const tip = {
    x: out.x + (v.x * 0.85 - u.x * 0.35) * tail * 0.6,
    y: out.y + (v.y * 0.85 - u.y * 0.35) * tail * 0.6,
  };
  const n = Math.max(2, Math.ceil(tail / step));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    pts.push({
      x: m * m * end.x + 2 * m * t * out.x + t * t * tip.x,
      y: m * m * end.y + 2 * m * t * out.y + t * t * tip.y,
    });
  }
  return pts;
};

export type Box = { left: number; top: number; right: number; bottom: number };

/**
 * Where the cord lies once it's untied: a loose, loopy string dropped from the anchor, `length`
 * long, drifting along `angle` (radians, 0 = right, π/2 = down), every point inside `box`.
 */
export const restPath = (
  anchor: Pt,
  length: number,
  size: number,
  box: Box,
  angle = 1.05,
  seed = 1,
  step = 3,
): Pt[] => {
  const pts: Pt[] = [{ ...anchor }];
  const L = Math.max(0, length);
  const b = size * 0.75; // loop radius
  const a = size * 0.26; // advance per radian
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const clampIn = (p: Pt): Pt => ({
    x: Math.min(box.right, Math.max(box.left, p.x)),
    y: Math.min(box.bottom, Math.max(box.top, p.y)),
  });
  // A prolate trochoid (a rolling-circle curve with loops), bent slowly and wobbled.
  let t = 0;
  let len = 0;
  let prev: Pt = { ...anchor };
  let guard = 0;
  while (len < L && guard++ < 20000) {
    t += step / Math.max(1, Math.hypot(a, b));
    const wob = 1 + (hash(Math.floor(t / 6.283) * 3.1 + seed) - 0.5) * 0.5;
    const bend = Math.sin(t * 0.18 + seed) * 0.28;
    const lx = a * t - b * wob * Math.sin(t);
    const ly = b * wob * (1 - Math.cos(t)) * 0.8;
    const cb = Math.cos(bend);
    const sb = Math.sin(bend);
    const rx = lx * cb - ly * sb;
    const ry = lx * sb + ly * cb;
    const p = clampIn({ x: anchor.x + rx * c - ry * s, y: anchor.y + rx * s + ry * c });
    const d = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (d < 0.01) continue;
    if (len + d > L) {
      const k = (L - len) / d;
      pts.push({ x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k });
      len = L;
      break;
    }
    pts.push(p);
    len += d;
    prev = p;
  }
  // Ran out of room (everything clamped flat): pad along the edge so the length still holds.
  while (len < L - 0.01 && guard++ < 40000) {
    const p = clampIn({ x: prev.x - Math.min(step, L - len), y: prev.y });
    const d = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (d < 0.01) break;
    pts.push(p);
    len += d;
    prev = p;
  }
  return pts;
};

/** A smooth SVG path through the points (quadratic midpoints). */
export const smoothPath = (xs: ArrayLike<number>, ys: ArrayLike<number>): string => {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return "";
  const X = (i: number) => at0(xs, i);
  const Y = (i: number) => at0(ys, i);
  let d = `M${String(round(X(0)))} ${String(round(Y(0)))}`;
  for (let i = 1; i < n - 1; i++) {
    d += `Q${String(round(X(i)))} ${String(round(Y(i)))} ${String(round((X(i) + X(i + 1)) / 2))} ${String(round((Y(i) + Y(i + 1)) / 2))}`;
  }
  return `${d}L${String(round(X(n - 1)))} ${String(round(Y(n - 1)))}`;
};

/**
 * How far the footer has scrolled in, 0 → 1: 0 while its top is still below the fold, 1 once it
 * has risen by most of a screen (or its own height, if less). A footer already on screen reads 1.
 */
export const scrollProgress = (top: number, height: number, viewport: number): number => {
  if (!(viewport > 0) || !Number.isFinite(top)) return 1;
  const span = Math.max(
    1,
    Math.min(Number.isFinite(height) && height > 0 ? height : viewport, viewport) * 0.7,
  );
  return clamp01((viewport - top) / span);
};

/** Eases `wind` toward `target`, never faster than `rate` per second. */
export const stepWind = (wind: number, target: number, dt: number, rate: number): number => {
  const want = (target - wind) * (1 - Math.exp(-Math.max(0, dt) * 5));
  const cap = Math.max(0, rate) * Math.max(0, dt);
  const next = wind + Math.max(-cap, Math.min(cap, want));
  return Math.abs(target - next) < 0.0005 ? target : clamp01(next);
};

export type Rope = {
  x: Float64Array;
  y: Float64Array;
  px: Float64Array;
  py: Float64Array;
  /** Rest length of one segment. */
  seg: number;
};

export const makeRope = (pts: Pt[]): Rope => {
  const n = pts.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  pts.forEach((p, i) => {
    x[i] = p.x;
    y[i] = p.y;
  });
  return {
    x,
    y,
    px: Float64Array.from(x),
    py: Float64Array.from(y),
    seg: n > 1 ? polyLength(pts) / (n - 1) : 0,
  };
};

type Drag = { i: number; x: number; y: number };

/**
 * One fixed step of the cord. It lies flat on a table, so there's no gravity, only friction.
 * Points below `locked` are wound on and ease onto `tied`; the rest are free, drift gently toward
 * `rest` while `attract` is on, and are kept one segment apart. `drag` pins one point.
 */
export const stepRope = (
  r: Rope,
  tied: Pt[],
  rest: Pt[],
  locked: number,
  attract: number,
  drag: Drag | null = null,
  iterations = 12,
): void => {
  const { x, y, px, py } = r;
  const n = x.length;
  const lockN = Math.max(1, Math.min(n, Math.floor(locked)));
  const pinned = (i: number) => i < lockN || (drag !== null && drag.i === i);
  const g = (arr: Float64Array, i: number) => arr[i] ?? 0;
  for (let i = 0; i < n; i++) {
    if (drag && drag.i === i) {
      px[i] = g(x, i);
      py[i] = g(y, i);
      x[i] = drag.x;
      y[i] = drag.y;
    } else if (i < lockN) {
      const t = tied[i];
      px[i] = g(x, i);
      py[i] = g(y, i);
      if (t) {
        // The anchor never moves; the rest snug on quickly but not instantly.
        const k = i === 0 ? 1 : 0.24;
        x[i] = g(x, i) + (t.x - g(x, i)) * k;
        y[i] = g(y, i) + (t.y - g(y, i)) * k;
      }
    } else {
      const vx = (g(x, i) - g(px, i)) * 0.9;
      const vy = (g(y, i) - g(py, i)) * 0.9;
      px[i] = g(x, i);
      py[i] = g(y, i);
      x[i] = g(x, i) + vx;
      y[i] = g(y, i) + vy;
      const q = rest[i];
      if (q && attract > 0) {
        x[i] = g(x, i) + (q.x - g(x, i)) * attract;
        y[i] = g(y, i) + (q.y - g(y, i)) * attract;
      }
    }
  }
  const seg = r.seg;
  for (let k = 0; k < iterations; k++) {
    for (let i = 0; i < n - 1; i++) {
      const a = pinned(i);
      const b = pinned(i + 1);
      if (a && b) continue;
      const dx = g(x, i + 1) - g(x, i);
      const dy = g(y, i + 1) - g(y, i);
      const d = Math.hypot(dx, dy) || 1e-6;
      const diff = (d - seg) / d;
      if (a) {
        x[i + 1] = g(x, i + 1) - dx * diff;
        y[i + 1] = g(y, i + 1) - dy * diff;
      } else if (b) {
        x[i] = g(x, i) + dx * diff;
        y[i] = g(y, i) + dy * diff;
      } else {
        x[i] = g(x, i) + dx * diff * 0.5;
        y[i] = g(y, i) + dy * diff * 0.5;
        x[i + 1] = g(x, i + 1) - dx * diff * 0.5;
        y[i + 1] = g(y, i + 1) - dy * diff * 0.5;
      }
    }
  }
};

/** The nearest free point to (x, y) within `reach`, or -1. */
export const nearestFree = (
  r: Rope,
  x: number,
  y: number,
  locked: number,
  reach: number,
): number => {
  let best = -1;
  let bd = reach * reach;
  for (let i = Math.max(1, Math.floor(locked)); i < r.x.length; i++) {
    const d = ((r.x[i] ?? 0) - x) ** 2 + ((r.y[i] ?? 0) - y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
};
// #endregion

export type ContactLink = { label: string; href: string };

export type EnvelopeNote = {
  /** Small line at the top of the note. */
  kicker?: string;
  text?: string;
  /** The mail button. */
  cta?: string;
};

export interface StringTieFooterProps {
  /** The three small labels across the top. Shown in brackets. */
  meta?: string[];
  /** Roman word of the headline. Split letter by letter: keep it Latin (Thai marks would split). */
  title?: string;
  /** Italic word of the headline. `""` hides it. */
  titleAccent?: string;
  /** The two taped labels under the headline: the first on the accent, the second on ink. */
  tapes?: string[];
  email?: string;
  phone?: string;
  links?: ContactLink[];
  regards?: string;
  /** The signature as single-stroke SVG paths in a 320 × 140 box, drawn in order. `[]` hides it. */
  signature?: string[];
  /** Used instead of `signature` when set: a name, in the script face. */
  signatureText?: string;
  /** What a screen reader hears for the signature. */
  signatureLabel?: string;
  /** What's on the note that slides out when the envelope is opened. */
  note?: EnvelopeNote;
  copiedLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  untieLabel?: string;
  retieLabel?: string;
  /** Minimum height. Any definite CSS length. */
  height?: string;
  /** The flap. */
  paper?: string;
  /** The body, and the text on the flap. */
  ink?: string;
  /** Text on the body. */
  bodyInk?: string;
  /** Buttons and the first tape. */
  accent?: string;
  /** The cord. */
  cord?: string;
  /** Text on accent and ink surfaces. */
  onAccent?: string;
  /** The note paper. */
  notePaper?: string;
  fontDisplay?: string;
  fontSans?: string;
  fontScript?: string;
  /** Paper grain opacity, 0 to turn it off. */
  grain?: number;
  /** Start opened, with the note out. */
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
}

const DEFAULT_META = ["Creative", "2023–2026", "Design"];
const DEFAULT_TAPES = ["Looking Forward to", "Connect with You!"];
const DEFAULT_NOTE: EnvelopeNote = {
  kicker: "A note, tucked inside",
  text: "Got a project, a role or just a hello? My inbox is open — I answer every letter.",
  cta: "Write to me",
};

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .9 0'/></filter>" +
  "<rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const EASE = "cubic-bezier(.22,1,.36,1)";

const CSS =
  ".stt{position:relative;isolation:isolate;overflow:hidden;overflow:clip;container-type:inline-size;width:100%;box-sizing:border-box;background:var(--stt-ink);color:var(--stt-ink);font-family:var(--stt-sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}" +
  ":where(.stt) *,:where(.stt) *::before,:where(.stt) *::after{box-sizing:border-box}" +
  ":where(.stt) button{appearance:none;background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer}" +
  ":where(.stt) a{color:inherit;text-decoration:none}" +
  ":where(.stt) h2,:where(.stt) p{margin:0}" +
  ".stt :focus-visible{outline:2px solid var(--stt-accent);outline-offset:4px;border-radius:4px}" +
  ".stt-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}" +
  ".stt-frame{--r:clamp(44px,7cqw,92px);--fold:0px;--R:clamp(36px,10cqw,150px);position:relative;display:flex;flex-direction:column;min-height:var(--stt-h)}" +
  ".stt.is-open .stt-frame{--fold:calc(var(--r) * 2.46)}" +
  ".stt-flapwrap{position:relative;z-index:3;pointer-events:none;filter:drop-shadow(0 calc(var(--r) * .12) calc(var(--r) * .2) rgba(0,0,0,.28))}" +
  ".stt-flap{position:relative;pointer-events:auto;background:var(--stt-paper);color:var(--stt-ink);clip-path:inset(0 0 var(--fold) 0 round 0 0 var(--R) var(--R));transition:clip-path .85s " +
  EASE +
  ";padding:clamp(26px,4.4cqw,64px) clamp(16px,6cqw,110px) 0}" +
  ".stt-flap::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:" +
  GRAIN +
  ";background-size:220px;opacity:calc(var(--stt-grain) * .9);mix-blend-mode:soft-light}" +
  ".stt-crease{position:absolute;left:0;right:0;bottom:var(--fold);height:calc(var(--r) * .5);pointer-events:none;background:linear-gradient(to top,rgba(0,0,0,.09),transparent);opacity:0;transition:opacity .5s,bottom .85s " +
  EASE +
  "}" +
  ".stt.is-open .stt-crease{opacity:1}" +
  ".stt-meta{position:relative;display:flex;justify-content:space-between;gap:12px;font-size:clamp(11px,1.45cqw,19px);letter-spacing:.01em}" +
  ".stt-meta span{opacity:0;transform:translateY(-6px);transition:opacity .8s,transform .8s " +
  EASE +
  "}" +
  ".stt-meta span:nth-child(2){transition-delay:.08s}.stt-meta span:nth-child(3){transition-delay:.16s}" +
  ".stt.is-in .stt-meta span{opacity:1;transform:none}" +
  ".stt-head{position:relative;display:flex;flex-direction:column;align-items:center;margin-top:clamp(36px,7.5cqw,120px)}" +
  ".stt-title{font-family:var(--stt-display);font-weight:400;font-size:clamp(58px,13.4cqw,200px);line-height:.9;letter-spacing:-.045em;white-space:nowrap;text-align:center;clip-path:inset(-.25em -.4em -.02em -.4em)}" +
  ".stt-title em{font-style:italic;letter-spacing:-.06em;margin-left:.06em}" +
  ".stt-ch{display:inline-block;transform:translateY(105%);transition:transform 1.1s " +
  EASE +
  ";transition-delay:calc(.15s + var(--i) * .045s)}" +
  ".stt.is-in .stt-ch{transform:none}" +
  ".stt.is-in .stt-title:hover .stt-ch{transition:transform .5s " +
  EASE +
  "}" +
  ".stt.is-in .stt-title .stt-ch:hover{transform:translateY(-.045em)}" +
  ".stt-tapes{position:relative;display:flex;flex-direction:column;align-items:center;margin-top:clamp(10px,1.6cqw,22px);font-family:var(--stt-display);font-size:clamp(20px,4cqw,56px);line-height:1.15;letter-spacing:-.01em}" +
  ".stt-tape{position:relative;display:inline-block;padding:.12em .42em .16em;white-space:nowrap;clip-path:inset(-20% 100% -20% 0);transition:clip-path .75s " +
  EASE +
  ",transform .5s " +
  EASE +
  "}" +
  ".stt-tape::before{content:'';position:absolute;inset:0;z-index:-1;background:var(--tb);clip-path:polygon(0 4%,1.2% 0,98.6% 3%,100% 0,99.2% 30%,100% 58%,98.8% 100%,1.6% 97%,0 100%,.9% 64%,0 34%);transition:filter .4s}" +
  ".stt-tape span{position:relative;color:var(--tc)}" +
  ".stt-tape-a{--tb:var(--stt-accent);--tc:var(--stt-on-accent);transform:rotate(-1.6deg) translateX(-.2em);transition-delay:.75s,0s}" +
  ".stt-tape-b{--tb:var(--stt-ink);--tc:var(--stt-paper);margin-top:.06em;transform:rotate(.5deg) translateX(.12em);transition-delay:.95s,0s}" +
  ".stt.is-in .stt-tape{clip-path:inset(-20% -2% -20% -2%)}" +
  ".stt-tape:hover{transition-delay:0s,0s}" +
  ".stt-tape-a:hover{transform:rotate(-3deg) translate(-.24em,-.06em)}" +
  ".stt-tape-b:hover{transform:rotate(1.6deg) translate(.16em,-.05em)}" +
  ".stt-tape:hover::before{filter:drop-shadow(0 .12em .1em rgba(0,0,0,.25))}" +
  ".stt-dock{position:relative;height:calc(var(--r) * 2.62);display:flex;justify-content:center;align-items:flex-end;padding-bottom:calc(var(--r) * .22)}" +
  ".stt-btn{position:relative;display:block;width:calc(var(--r) * 2);height:calc(var(--r) * 2);border-radius:50%;filter:drop-shadow(0 calc(var(--r) * .07) calc(var(--r) * .09) rgba(0,0,0,.32)) drop-shadow(0 1px 1px rgba(0,0,0,.28));transition:transform .45s " +
  EASE +
  ",filter .45s " +
  EASE +
  ";-webkit-tap-highlight-color:transparent}" +
  ".stt-btn:hover{transform:translateY(-3px) scale(1.025)}" +
  ".stt-btn:active{transform:translateY(0) scale(.97);transition-duration:.12s}" +
  ".stt-btn:focus-visible{outline-offset:6px;border-radius:50%}" +
  ".stt-spin{display:block;width:100%;height:100%;will-change:transform}" +
  ".stt-btn svg{display:block;width:100%;height:100%;max-width:none;overflow:visible}" +
  ".stt-gloss{position:absolute;inset:0;pointer-events:none}" +
  ".stt.is-open .stt-btn-top{opacity:0;pointer-events:none}" +
  ".stt-body{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;color:var(--stt-body-ink)}" +
  ".stt-panel{position:absolute;inset:0;z-index:2;background:var(--stt-ink)}" +
  ".stt-panel::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:" +
  GRAIN +
  ";background-size:220px;opacity:calc(var(--stt-grain) * .7);mix-blend-mode:soft-light}" +
  ".stt-dock-b{position:relative;z-index:4;height:calc(var(--r) * 2.62);display:flex;justify-content:center;align-items:flex-start;padding-top:calc(var(--r) * .22)}" +
  ".stt-content{position:relative;z-index:3;flex:1;display:grid;grid-template-columns:1fr auto;align-items:end;gap:32px;padding:clamp(28px,5cqw,80px) clamp(16px,8cqw,140px) clamp(36px,6.5cqw,110px)}" +
  ".stt-contacts{display:flex;flex-direction:column;gap:clamp(14px,1.6cqw,22px);font-size:clamp(16px,1.55cqw,20px);opacity:0;transform:translateY(14px);transition:opacity .9s .5s,transform .9s .5s " +
  EASE +
  "}" +
  ".stt.is-in .stt-contacts{opacity:1;transform:none}" +
  ".stt-k{display:block;font-size:.88em;opacity:.7;margin-bottom:.28em;font-weight:300}" +
  ".stt-v{position:relative;display:inline-flex;align-items:center;gap:.5em;min-height:44px;font-weight:500;text-align:left;transition:color .25s}" +
  ".stt-v:hover{color:var(--stt-paper)}" +
  ".stt-copied{font-size:.68em;font-weight:500;padding:.25em .65em;border-radius:99px;background:var(--stt-accent);color:var(--stt-on-accent);opacity:0;transform:translateX(-6px) scale(.9);transition:opacity .3s,transform .4s " +
  EASE +
  "}" +
  ".stt-copied.is-on{opacity:1;transform:none}" +
  ".stt-links{display:flex;flex-direction:column;gap:.3em}" +
  ".stt-link{position:relative;display:inline-flex;align-items:center;gap:.35em;width:fit-content;min-height:44px;background:linear-gradient(currentColor,currentColor) 0 80%/100% 1px no-repeat;transition:background-size .5s " +
  EASE +
  ",color .25s}" +
  ".stt-link:hover{background-size:0 1px;background-position:100% 80%;color:var(--stt-paper)}" +
  ".stt-link svg{width:.7em;height:.7em;flex:none;max-width:none;opacity:0;transform:translate(-4px,4px);transition:opacity .3s,transform .4s " +
  EASE +
  "}" +
  ".stt-link:hover svg{opacity:1;transform:none}" +
  ".stt-regards{display:flex;flex-direction:column;align-items:center;padding-right:clamp(0px,2cqw,40px);opacity:0;transform:translateY(14px);transition:opacity .9s .65s,transform .9s .65s " +
  EASE +
  "}" +
  ".stt.is-in .stt-regards{opacity:1;transform:none}" +
  ".stt-regards-t{font-family:var(--stt-display);font-size:clamp(22px,2.9cqw,40px);line-height:1.2}" +
  ".stt-sign-text{display:block;font-family:var(--stt-script);font-size:clamp(40px,5.4cqw,76px);line-height:1.1;padding:0 .2em;clip-path:inset(-20% 100% -20% 0);transition:clip-path 1.6s cubic-bezier(.55,.1,.35,1)}" +
  ".stt.is-signed .stt-sign-text{clip-path:inset(-20% -10% -20% 0)}" +
  ".stt-sign{display:block;width:clamp(190px,24cqw,340px);height:auto;max-width:none;margin-top:-.2em;color:var(--stt-body-ink);overflow:visible}" +
  ".stt-sign path{fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--l,1200) var(--l,1200);stroke-dashoffset:var(--l,1200)}" +
  ".stt.is-signed .stt-sign path{transition:stroke-dashoffset var(--d,1s) cubic-bezier(.55,.1,.35,1) var(--w,0s);stroke-dashoffset:0}" +
  ".stt-letter{position:absolute;z-index:1;left:50%;bottom:calc(100% - var(--tuck));--tuck:clamp(30px,4cqw,60px);width:min(620px,calc(100% - 32px));height:calc(var(--r) * 2.46 - var(--r) * .14 + var(--tuck));transform:translate(-50%,calc(var(--r) * 1.2));transition:transform .7s " +
  EASE +
  ";background:var(--stt-note);color:var(--stt-ink);border-radius:4px 4px 0 0;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:clamp(12px,1.9cqw,26px) clamp(16px,2.6cqw,36px) var(--tuck);display:flex;flex-direction:column;justify-content:center;gap:clamp(6px,1cqw,12px);overflow:hidden}" +
  ".stt-letter::after{content:'';position:absolute;inset:0;pointer-events:none;background-image:" +
  GRAIN +
  ";background-size:220px;opacity:calc(var(--stt-grain) * .8);mix-blend-mode:soft-light}" +
  ".stt.is-open .stt-letter{transform:translate(-50%,0);transition:transform .9s .3s " +
  EASE +
  "}" +
  ".stt-letter>*{position:relative;z-index:1}" +
  ".stt-note-k{font-size:clamp(12px,1.05cqw,14px);color:var(--stt-accent);font-weight:600}" +
  ".stt-note-t{font-family:var(--stt-display);font-size:clamp(16px,2.1cqw,26px);line-height:1.35;max-width:26em}" +
  ".stt-note-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:clamp(14px,1.2cqw,16px)}" +
  ".stt-cta{display:inline-flex;align-items:center;gap:.5em;min-height:44px;padding:.55em 1.05em;border-radius:.5rem;background:var(--stt-ink);color:var(--stt-paper);font-weight:600;transition:background .3s,transform .3s " +
  EASE +
  "}" +
  ".stt-cta:hover{background:var(--stt-accent);transform:translateY(-1px)}" +
  ".stt-cta svg{width:.8em;height:.8em;max-width:none}" +
  ".stt-ghost{min-height:44px;font-weight:500;opacity:.75;text-decoration:underline;text-underline-offset:3px;transition:opacity .2s}" +
  ".stt-ghost:hover{opacity:1}" +
  ".stt-cord{position:absolute;left:0;top:0;z-index:5;overflow:visible;max-width:none;pointer-events:none}" +
  ".stt-cord path{fill:none;stroke-linecap:round;stroke-linejoin:round}" +
  ".stt-cord .stt-hit{stroke:transparent;stroke-width:22px;pointer-events:none;cursor:grab;touch-action:none}" +
  ".stt-cord.is-loose .stt-hit{pointer-events:stroke}" +
  ".stt-cord.is-drag .stt-hit{cursor:grabbing}" +
  "@container (max-width: 640px){" +
  ".stt-content{grid-template-columns:1fr;align-items:start;gap:40px}" +
  ".stt-regards{align-items:flex-start;padding-right:0}" +
  ".stt-meta span:nth-child(2){display:none}" +
  "}" +
  "@media (prefers-reduced-motion: reduce){" +
  ".stt *,.stt *::before{transition-duration:.01s !important;transition-delay:0s !important}" +
  ".stt-ch,.stt-meta span{transform:none}" +
  "}";

/** Stamps each signature stroke's length (and when to start it) for the write-in. */
const useSignatureLengths = (ref: React.RefObject<SVGSVGElement | null>, key: string) => {
  React.useEffect(() => {
    const paths = ref.current ? Array.from(ref.current.querySelectorAll("path")) : [];
    let at = 0;
    paths.forEach((p) => {
      const l = Math.ceil(p.getTotalLength()) + 2;
      const d = Math.max(0.14, l / 620);
      p.style.setProperty("--l", String(l));
      p.style.setProperty("--d", `${d.toFixed(2)}s`);
      p.style.setProperty("--w", `${at.toFixed(2)}s`);
      at += d + 0.06;
    });
  }, [ref, key]);
};

// shortcut: the grommet metal stays as the original greys (decorative SVG gradient stops)
function ButtonFace({ uid, accent }: { uid: string; accent: string }) {
  return (
    <svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${uid}p`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.1"
            numOctaves="3"
            seed="7"
            result="n"
          />
          <feDiffuseLighting
            in="n"
            surfaceScale="1.4"
            diffuseConstant="1.05"
            lightingColor="#fff"
            result="l"
          >
            <feDistantLight azimuth="235" elevation="56" />
          </feDiffuseLighting>
          <feComposite
            in="l"
            in2="SourceGraphic"
            operator="arithmetic"
            k1="0.62"
            k2="0"
            k3="0.44"
            k4="0"
            result="m"
          />
          <feComposite in="m" in2="SourceAlpha" operator="in" />
        </filter>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9def5" />
          <stop offset=".3" stopColor="#6b75a8" />
          <stop offset=".55" stopColor="#1a1f45" />
          <stop offset=".8" stopColor="#8d97c8" />
          <stop offset="1" stopColor="#262b58" />
        </linearGradient>
        <linearGradient id={`${uid}n`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c4cbea" />
          <stop offset=".45" stopColor="#3a4274" />
          <stop offset="1" stopColor="#11142e" />
        </linearGradient>
        <mask id={`${uid}h`}>
          <rect x="-100" y="-100" width="200" height="200" fill="#fff" />
          <circle r="12.5" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${uid}h)`}>
        <circle r="95" style={{ fill: accent }} filter={`url(#${uid}p)`} />
        <circle r="33" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="3.5" />
        <circle r="35.5" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
        <circle r="26" fill={`url(#${uid}m)`} />
        <circle r="26" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="1" />
        <circle r="18.5" fill={`url(#${uid}n)`} />
        <circle r="13" fill="none" stroke="#0b0d22" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

/** Light that stays put while the disc turns underneath it. */
function ButtonGloss({ uid }: { uid: string }) {
  return (
    <svg className="stt-gloss" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${uid}g`} cx=".32" cy=".26" r=".85">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".24" />
        </radialGradient>
        <mask id={`${uid}k`}>
          <rect x="-100" y="-100" width="200" height="200" fill="#fff" />
          <circle r="12.5" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${uid}k)`}>
        <circle r="95" fill={`url(#${uid}g)`} />
        <circle r="94" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.4" />
        <path
          d="M-17 -12A21 21 0 0 1 -3 -21"
          fill="none"
          stroke="rgba(255,255,255,.85)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M14 15A21 21 0 0 1 3 21"
          fill="none"
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

const Arrow = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path
      d="M2.5 9.5L9.5 2.5M4 2.5H9.5V8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SEGMENTS = 96;

type Sim = {
  rope: Rope | null;
  tied: Pt[];
  rest: Pt[];
  w: number;
  h: number;
  scale: number;
  cordW: number;
  wind: number;
  intent: "open" | "sealed";
  fast: boolean;
  attract: number;
  drag: (Drag & { id: number }) | null;
  seenAt: number;
  holdUntil: number;
  acc: number;
  last: number;
  raf: number;
  visible: boolean;
  reduced: boolean;
  loose: boolean;
  signed: boolean;
  open: boolean;
  ptr: { x: number; y: number; vx: number; vy: number } | null;
};

export function StringTieFooter({
  meta = DEFAULT_META,
  title = "Thank",
  titleAccent = "You",
  tapes = DEFAULT_TAPES,
  email,
  phone,
  links = [],
  regards = "Warm Regards,",
  signature = [],
  signatureText,
  signatureLabel = "Signature",
  note = DEFAULT_NOTE,
  copiedLabel = "Copied",
  emailLabel = "Email",
  phoneLabel = "Phone",
  untieLabel = "Untie the envelope",
  retieLabel = "Tie it back up",
  height = "100svh",
  paper = "#ffffff",
  ink = "#0d1115",
  bodyInk = "#eef0f3",
  accent = "#1f78d1",
  cord = "#2c55d6",
  onAccent = "#ffffff",
  notePaper = "#f7f3ea",
  fontDisplay = "'Instrument Serif', Didot, 'Times New Roman', serif",
  fontSans = "ui-sans-serif, system-ui, sans-serif",
  fontScript = "'Segoe Script', 'Brush Script MT', cursive",
  grain = 0.5,
  defaultOpen = false,
  onToggle,
  className = "",
}: StringTieFooterProps) {
  const uid = `stt${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rootRef = React.useRef<HTMLElement>(null);
  const topRef = React.useRef<HTMLButtonElement>(null);
  const botRef = React.useRef<HTMLButtonElement>(null);
  const spinTopRef = React.useRef<HTMLSpanElement>(null);
  const spinBotRef = React.useRef<HTMLSpanElement>(null);
  const flapRef = React.useRef<HTMLDivElement>(null);
  const letterRef = React.useRef<HTMLDivElement>(null);
  const cordRef = React.useRef<SVGSVGElement>(null);
  const shadowRef = React.useRef<SVGPathElement>(null);
  const bodyRef = React.useRef<SVGPathElement>(null);
  const twistRef = React.useRef<SVGPathElement>(null);
  const hitRef = React.useRef<SVGPathElement>(null);
  const tipRef = React.useRef<SVGLineElement>(null);
  const signRef = React.useRef<SVGSVGElement>(null);

  const [seen, setSeen] = React.useState(false);
  const [open, setOpen] = React.useState(defaultOpen);
  const [signed, setSigned] = React.useState(false);
  const [copied, setCopied] = React.useState(0);
  const [loose, setLoose] = React.useState(true);

  const sim = React.useRef<Sim>({
    rope: null,
    tied: [],
    rest: [],
    w: 0,
    h: 0,
    scale: 1,
    cordW: 3,
    wind: 0,
    intent: defaultOpen ? "open" : "sealed",
    fast: false,
    attract: 0.05,
    drag: null,
    seenAt: 0,
    holdUntil: 0,
    acc: 0,
    last: 0,
    raf: 0,
    visible: false,
    reduced: false,
    loose: true,
    signed: false,
    open: defaultOpen,
    ptr: null,
  });

  useSignatureLengths(signRef, signature.join("|"));

  const draw = React.useCallback(() => {
    const s = sim.current;
    const r = s.rope;
    if (!r) return;
    const d = smoothPath(r.x, r.y);
    for (const el of [shadowRef, bodyRef, twistRef, hitRef]) el.current?.setAttribute("d", d);
    const n = r.x.length;
    const tip = tipRef.current;
    if (tip && n > 2) {
      // the aglet: a short metal sleeve on the free end, along its last segment
      const ex = r.x[n - 1] ?? 0;
      const ey = r.y[n - 1] ?? 0;
      const dx = ex - (r.x[n - 3] ?? 0);
      const dy = ey - (r.y[n - 3] ?? 0);
      const l = Math.hypot(dx, dy) || 1;
      const len = s.cordW * 3.4;
      tip.setAttribute("x1", String(round(ex - (dx / l) * len)));
      tip.setAttribute("y1", String(round(ey - (dy / l) * len)));
      tip.setAttribute("x2", String(round(ex)));
      tip.setAttribute("y2", String(round(ey)));
    }
    const w = s.cordW;
    bodyRef.current?.setAttribute("stroke-width", String(w));
    shadowRef.current?.setAttribute("stroke-width", String(w + 1.2));
    twistRef.current?.setAttribute("stroke-width", String(round(w * 0.42)));
    twistRef.current?.setAttribute(
      "stroke-dasharray",
      `${String(round(w * 0.9))} ${String(round(w * 1.25))}`,
    );
    tip?.setAttribute("stroke-width", String(round(w * 1.55)));
  }, []);

  // ---- geometry: where the buttons are, the tied and the loose shapes -------------
  const measure = React.useCallback(() => {
    const root = rootRef.current;
    const t = topRef.current;
    const b = botRef.current;
    const flap = flapRef.current;
    if (!root || !t || !b || !flap) return;
    const s = sim.current;
    const rr = root.getBoundingClientRect();
    const scale = root.offsetWidth ? rr.width / root.offsetWidth : 1;
    s.scale = scale || 1;
    const local = (el: Element): Pt => {
      const q = el.getBoundingClientRect();
      return {
        x: (q.left + q.width / 2 - rr.left) / s.scale,
        y: (q.top + q.height / 2 - rr.top) / s.scale,
      };
    };
    const top = local(t);
    const bottom = local(b);
    const r = t.offsetWidth / 2;
    s.w = root.offsetWidth;
    s.h = root.offsetHeight;
    s.cordW = Math.max(2.2, Math.min(3.6, r * 0.036));
    const seam = flap.offsetHeight;
    const tiedRaw = tiePath(top, bottom, r * 0.4, r * 0.95);
    const L = polyLength(tiedRaw);
    s.tied = resample(tiedRaw, SEGMENTS);
    const pad = Math.max(10, r * 0.2);
    const box = { left: pad, top: seam + pad, right: s.w - pad, bottom: s.h - pad };
    // Wide: the loose cord drifts down and to the right. Narrow: it curls down the middle.
    const narrow = s.w < 640;
    s.rest = resample(
      restPath(bottom, L, r * (narrow ? 0.58 : 0.66), box, narrow ? 1.5 : 1.4, 2),
      SEGMENTS,
    );
    const cordEl = cordRef.current;
    if (cordEl) {
      cordEl.setAttribute("viewBox", `0 0 ${String(s.w)} ${String(s.h)}`);
      cordEl.setAttribute("width", String(s.w));
      cordEl.setAttribute("height", String(s.h));
    }
    if (!s.rope || s.rope.x.length !== s.tied.length) {
      s.rope = makeRope(s.wind > 0.5 ? s.tied : s.rest);
    } else {
      s.rope.seg = L / SEGMENTS;
      // Anything wound on follows the buttons when the layout moves.
      const k = Math.floor(s.wind * (SEGMENTS + 1));
      for (let i = 0; i < s.rope.x.length; i++) {
        const q = i < k ? s.tied[i] : s.rest[i];
        if (!q) continue;
        s.rope.x[i] = s.rope.px[i] = q.x;
        s.rope.y[i] = s.rope.py[i] = q.y;
      }
    }
    draw();
  }, [draw]);

  // ---- the loop -------------------------------------------------------------------
  const tickRef = React.useRef<(now: number) => void>(() => undefined);
  const tick = React.useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      const root = rootRef.current;
      const rope = s.rope;
      if (!root || !rope) return;
      const dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : 0.016);
      s.last = now;

      const rect = root.getBoundingClientRect();
      const p = scrollProgress(rect.top, rect.height, window.innerHeight);
      const started = s.seenAt > 0 && now - s.seenAt > (s.reduced ? 0 : 900);
      const target = s.intent === "sealed" && started && now >= s.holdUntil ? p : 0;
      s.wind = s.reduced ? target : stepWind(s.wind, target, dt, s.fast ? 1.5 : 0.85);
      if (s.wind === target) s.fast = false;
      const locked = s.wind * (SEGMENTS + 1);

      // the top button turns as the cord goes round it
      if (spinTopRef.current)
        spinTopRef.current.style.transform = `rotate(${String(round(s.wind * 540))}deg)`;
      if (spinBotRef.current)
        spinBotRef.current.style.transform = `rotate(${String(round(s.wind * -200))}deg)`;

      if (s.reduced) {
        const k = Math.floor(locked);
        for (let i = 0; i < rope.x.length; i++) {
          const q = i < Math.max(1, k) ? s.tied[i] : s.rest[i];
          if (!q) continue;
          rope.x[i] = rope.px[i] = q.x;
          rope.y[i] = rope.py[i] = q.y;
        }
      } else {
        s.acc += dt;
        while (s.acc >= 1 / 60) {
          s.acc -= 1 / 60;
          // A pointer brushing past pushes the loose cord along.
          const ptr = s.ptr;
          if (ptr && !s.drag) {
            const reach = 46;
            for (let i = Math.max(1, Math.floor(locked)); i < rope.x.length; i++) {
              const dx = (rope.x[i] ?? 0) - ptr.x;
              const dy = (rope.y[i] ?? 0) - ptr.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < reach * reach) {
                const f = (1 - Math.sqrt(d2) / reach) * 0.22;
                rope.x[i] = (rope.x[i] ?? 0) + ptr.vx * f;
                rope.y[i] = (rope.y[i] ?? 0) + ptr.vy * f;
              }
            }
            ptr.vx *= 0.6;
            ptr.vy *= 0.6;
          }
          stepRope(rope, s.tied, s.rest, locked, s.attract, s.drag);
        }
      }
      draw();

      const isLoose = locked < SEGMENTS * 0.98;
      if (isLoose !== s.loose) {
        s.loose = isLoose;
        setLoose(isLoose);
      }
      if (!s.signed && s.wind > 0.985) {
        s.signed = true;
        setSigned(true);
      }
      // Unwound all the way: now the flap can fold back.
      if (s.intent === "open" && s.wind < 0.015 && !s.open) {
        s.open = true;
        setOpen(true);
      }
      if (s.visible) s.raf = requestAnimationFrame(tickRef.current);
    },
    [draw],
  );
  React.useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const wake = React.useCallback(() => {
    const s = sim.current;
    if (!s.raf && s.visible) {
      s.last = 0;
      s.raf = requestAnimationFrame(tickRef.current);
    }
  }, []);

  React.useEffect(() => {
    const s = sim.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    s.reduced = mq.matches;
    const onMq = () => {
      s.reduced = mq.matches;
    };
    mq.addEventListener("change", onMq);

    measure();
    const root = rootRef.current;
    const ro = new ResizeObserver(() => {
      measure();
    });
    if (root) ro.observe(root);
    // Fonts landing late reflow the headline and move the seam.
    void document.fonts.ready.then(() => {
      measure();
    });

    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        s.visible = on;
        if (on && !s.seenAt) {
          s.seenAt = performance.now();
          setSeen(true);
        }
        if (on) wake();
      },
      { threshold: 0.12 },
    );
    if (root) io.observe(root);
    return () => {
      io.disconnect();
      ro.disconnect();
      mq.removeEventListener("change", onMq);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.visible = false;
    };
  }, [measure, wake]);

  // Closed notes aren't reachable by keyboard or screen reader.
  React.useEffect(() => {
    const el = letterRef.current;
    if (!el) return;
    el.inert = !open;
  }, [open]);

  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => {
      setCopied(0);
    }, 2200);
    return () => {
      clearTimeout(id);
    };
  }, [copied]);

  const toggle = (want?: boolean) => {
    const s = sim.current;
    const next = want ?? s.intent === "sealed";
    if (next === (s.intent === "open")) return;
    s.fast = true;
    s.attract = 0.05;
    s.drag = null;
    onToggle?.(next);
    if (next) {
      // unwind first; the loop folds the flap back once the cord is off
      s.intent = "open";
    } else {
      // fold the flap down first, then wind the cord back on
      s.open = false;
      s.intent = "sealed";
      s.holdUntil = performance.now() + (s.reduced ? 0 : 650);
      setOpen(false);
    }
    wake();
  };

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied((c) => c + 1);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  // ---- dragging the loose cord ------------------------------------------------------
  const toLocal = (e: React.PointerEvent) => {
    const rr = rootRef.current?.getBoundingClientRect();
    const s = sim.current;
    return {
      x: (e.clientX - (rr?.left ?? 0)) / s.scale,
      y: (e.clientY - (rr?.top ?? 0)) / s.scale,
    };
  };
  const onCordDown = (e: React.PointerEvent<SVGPathElement>) => {
    const s = sim.current;
    if (!s.rope) return;
    const p = toLocal(e);
    const i = nearestFree(s.rope, p.x, p.y, s.wind * (SEGMENTS + 1), 30);
    if (i < 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    s.drag = { i, x: p.x, y: p.y, id: e.pointerId };
    // once someone's moved the cord, it stays where they leave it
    s.attract = 0;
    cordRef.current?.classList.add("is-drag");
    wake();
  };
  const onCordMove = (e: React.PointerEvent<SVGPathElement>) => {
    const s = sim.current;
    if (s.drag?.id !== e.pointerId) return;
    const p = toLocal(e);
    s.drag.x = Math.min(s.w - 4, Math.max(4, p.x));
    s.drag.y = Math.min(s.h - 4, Math.max(4, p.y));
  };
  const onCordUp = (e: React.PointerEvent<SVGPathElement>) => {
    const s = sim.current;
    if (s.drag?.id !== e.pointerId) return;
    s.drag = null;
    cordRef.current?.classList.remove("is-drag");
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const s = sim.current;
    const p = toLocal(e);
    const prev = s.ptr;
    // A jump (the pointer coming back in, a fast flick) is capped, so it nudges rather than flings.
    const cap = (v: number) => Math.max(-14, Math.min(14, v));
    s.ptr = { x: p.x, y: p.y, vx: prev ? cap(p.x - prev.x) : 0, vy: prev ? cap(p.y - prev.y) : 0 };
  };

  const style = {
    "--stt-paper": paper,
    "--stt-ink": ink,
    "--stt-body-ink": bodyInk,
    "--stt-accent": accent,
    "--stt-on-accent": onAccent,
    "--stt-note": notePaper,
    "--stt-display": fontDisplay,
    "--stt-sans": fontSans,
    "--stt-script": fontScript,
    "--stt-grain": String(grain),
    "--stt-h": height,
  } as React.CSSProperties;

  let ci = 0;
  // grapheme by grapheme, so Thai vowels and tone marks stay on their letter
  const letters = (word: string) =>
    Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word),
      (x) => x.segment,
    ).map((c, i) => (
      <span key={i} className="stt-ch" style={{ "--i": ci++ } as React.CSSProperties}>
        {c === " " ? " " : c}
      </span>
    ));

  const mailHref = email ? `mailto:${email}` : undefined;
  const external = (href: string) => /^https?:/.test(href);
  const heading = [title, titleAccent].filter(Boolean).join(" ");

  return (
    <footer
      ref={rootRef}
      className={`stt${seen ? " is-in" : ""}${open ? " is-open" : ""}${signed ? " is-signed" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={() => {
        sim.current.ptr = null;
      }}
    >
      <style>{CSS}</style>
      <div className="stt-frame">
        <div className="stt-flapwrap">
          <div ref={flapRef} className="stt-flap">
            {meta.length > 0 && (
              <div className="stt-meta">
                {meta.slice(0, 3).map((m, i) => (
                  <span key={i}>({m})</span>
                ))}
              </div>
            )}
            <div className="stt-head">
              <h2 className="stt-title">
                <span className="stt-sr">{heading}</span>
                <span aria-hidden="true">
                  {letters(title)}
                  {titleAccent && (
                    <>
                      {" "}
                      <em>{letters(titleAccent)}</em>
                    </>
                  )}
                </span>
              </h2>
              {tapes.length > 0 && (
                <p className="stt-tapes">
                  {tapes.slice(0, 2).map((t, i) => (
                    <React.Fragment key={i}>
                      <span className={`stt-tape ${i ? "stt-tape-b" : "stt-tape-a"}`}>
                        <span>{t}</span>
                      </span>
                      {i === 0 && tapes.length > 1 && <span className="stt-sr"> </span>}
                    </React.Fragment>
                  ))}
                </p>
              )}
            </div>
            <div className="stt-dock">
              <button
                ref={topRef}
                type="button"
                className="stt-btn stt-btn-top"
                onClick={() => {
                  toggle(true);
                }}
                aria-label={untieLabel}
                aria-controls={`${uid}note`}
                aria-expanded={open}
                tabIndex={open ? -1 : 0}
                aria-hidden={open || undefined}
              >
                <span ref={spinTopRef} className="stt-spin">
                  <ButtonFace uid={`${uid}t`} accent={accent} />
                </span>
                <ButtonGloss uid={`${uid}t`} />
              </button>
            </div>
            <div className="stt-crease" aria-hidden="true" />
          </div>
        </div>

        <div className="stt-body">
          <div
            ref={letterRef}
            id={`${uid}note`}
            className="stt-letter"
            role="region"
            aria-label={note.kicker ?? "Note"}
          >
            {note.kicker && <p className="stt-note-k">{note.kicker}</p>}
            {note.text && <p className="stt-note-t">{note.text}</p>}
            <div className="stt-note-row">
              {email && (
                <a className="stt-cta" href={mailHref}>
                  {note.cta ?? "Write to me"}
                  <Arrow />
                </a>
              )}
              <button
                type="button"
                className="stt-ghost"
                onClick={() => {
                  toggle(false);
                }}
              >
                {retieLabel}
              </button>
            </div>
          </div>
          <div className="stt-panel" aria-hidden="true" />
          <div className="stt-dock-b">
            <button
              ref={botRef}
              type="button"
              className="stt-btn"
              onClick={() => {
                toggle();
              }}
              aria-label={open ? retieLabel : untieLabel}
              aria-controls={`${uid}note`}
              aria-expanded={open}
            >
              <span ref={spinBotRef} className="stt-spin">
                <ButtonFace uid={`${uid}b`} accent={accent} />
              </span>
              <ButtonGloss uid={`${uid}b`} />
            </button>
          </div>

          <div className="stt-content">
            <div className="stt-contacts">
              {email && (
                <div>
                  <span className="stt-k">{emailLabel}</span>
                  <button
                    type="button"
                    className="stt-v"
                    onClick={() => {
                      void copy();
                    }}
                  >
                    {email}
                    <span className={`stt-copied${copied ? " is-on" : ""}`} aria-hidden="true">
                      {copiedLabel}
                    </span>
                  </button>
                  <span className="stt-sr" role="status">
                    {copied ? copiedLabel : ""}
                  </span>
                </div>
              )}
              {phone && (
                <div>
                  <span className="stt-k">{phoneLabel}</span>
                  <a className="stt-v" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                    {phone}
                  </a>
                </div>
              )}
              {links.length > 0 && (
                <nav className="stt-links" aria-label="Links">
                  {links.map((l, i) => (
                    <a
                      key={i}
                      className="stt-link"
                      href={l.href}
                      target={external(l.href) ? "_blank" : undefined}
                      rel={external(l.href) ? "noopener noreferrer" : undefined}
                    >
                      {l.label}
                      <Arrow />
                    </a>
                  ))}
                </nav>
              )}
            </div>

            {(regards || signature.length > 0 || signatureText) && (
              <div className="stt-regards">
                {regards && <p className="stt-regards-t">{regards}</p>}
                {signatureText ? (
                  <span className="stt-sign-text" role="img" aria-label={signatureLabel}>
                    {signatureText}
                  </span>
                ) : (
                  signature.length > 0 && (
                    <svg
                      ref={signRef}
                      className="stt-sign"
                      viewBox="0 0 320 140"
                      role="img"
                      aria-label={signatureLabel}
                    >
                      {signature.map((d, i) => (
                        <path key={i} d={d} />
                      ))}
                    </svg>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <svg
        ref={cordRef}
        className={`stt-cord${loose ? " is-loose" : ""}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id={`${uid}s`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <path
          ref={shadowRef}
          stroke="rgba(0,0,0,.32)"
          transform="translate(1.2 2.6)"
          filter={`url(#${uid}s)`}
        />
        <path ref={bodyRef} style={{ stroke: cord }} />
        <path ref={twistRef} stroke="rgba(255,255,255,.2)" />
        <line ref={tipRef} stroke="#9aa3c7" strokeLinecap="round" />
        <path
          ref={hitRef}
          className="stt-hit"
          onPointerDown={onCordDown}
          onPointerMove={onCordMove}
          onPointerUp={onCordUp}
          onPointerCancel={onCordUp}
        />
      </svg>
    </footer>
  );
}
