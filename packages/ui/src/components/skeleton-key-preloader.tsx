"use client";

// Skeleton Key Preloader, by Kedhareswer Naidu (21st.dev/@kedhareswer, MIT), vendored with small
// changes for crocwork.studio: no Google Fonts by default (fontHref null, faces via the `faces`
// prop, so the hub self-hosts them), neutral defaults instead of the author's details, and the
// strict-lint fixes this repo needs. The timeline, art and physics are the original.
//
// A typographic collage that assembles itself while a page loads, then unlocks it. The word is
// cut four ways: a bitmap letter printed pixel by pixel, a superscript ring, a monogram inside a
// dial that doubles as the progress ring, and the rest in quill script, with a pill tag, two ink
// swooshes, a clock set to the visitor's time, a typed line and a spaced signature. A gilded
// skeleton key drops in on a spring early on and hangs over the whole thing. At 100 the version
// ticks over, the monogram melts into a keyhole, the key slides in and turns, the dial clicks,
// and the camera dives through the keyhole. Grab the key and throw it while it loads.

import * as React from "react";

export type SkeletonKeyMetal = "gold" | "silver" | "rose" | "bronze";

export interface SkeletonKeyPreloaderProps {
  /** Content revealed through the keyhole. Ignored while `loop` is set. */
  children?: React.ReactNode;
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean;
  /** Real loading progress, 0–100. Undefined runs the simulated load over `durationMs`. */
  progress?: number;
  /** Length of the simulated load. */
  durationMs?: number;
  /** "auto" turns the key by itself at 100; "key" waits for the visitor to drop it in. */
  unlock?: "auto" | "key";
  greeting?: string;
  /** The wordmark: first letter in pixels, the second as a superscript, two in the dial, the rest in script. */
  word?: string;
  tags?: string[];
  /** The end card and the accessible label. */
  name?: string;
  aboutLabel?: string;
  about?: string[];
  links?: string[];
  signature?: string;
  /** What the handwritten version lands on at 100. It counts 0.0 → 0.9 first. */
  release?: string;
  metal?: SkeletonKeyMetal;
  /** Paper colour (a concrete colour: it is used as an SVG fill). */
  paper?: string;
  /** Ink colour. */
  ink?: string;
  hud?: boolean;
  /** Text of the hint along the bottom while it loads. */
  grabLabel?: string;
  /** Stylesheet for the faces. null (the default here) loads nothing. */
  fontHref?: string | null;
  /** Font stacks; defaults keep the original faces as first choice. */
  faces?: { grotesk?: string; script?: string; hand?: string; mono?: string };
  height?: string;
  onComplete?: () => void;
  className?: string;
}

const FONT_PROBES = [
  '500 1em "Space Grotesk"',
  '400 1em "Space Grotesk"',
  '400 1em "Fleur De Leah"',
  '500 1em "Caveat"',
  '400 1em "Space Mono"',
];

type Metal = { stops: string[]; light: string; edge: string };

// the key's metal: a painted illustration, kept as the original's colour stops
const METALS: Record<SkeletonKeyMetal, Metal> = {
  gold: {
    stops: ["#4a2c06", "#9c6a1a", "#e9bf55", "#fff1b8", "#f0c75e", "#b07d24", "#6b440c"],
    light: "#fff3d1",
    edge: "#3a2204",
  },
  silver: {
    stops: ["#2c3036", "#7d838c", "#d4d8de", "#ffffff", "#c9ced5", "#8b9199", "#40454c"],
    light: "#ffffff",
    edge: "#22262b",
  },
  rose: {
    stops: ["#4a1d16", "#9a5242", "#e7a790", "#fff0e6", "#eaa98f", "#a8624f", "#5e2a20"],
    light: "#fff1ea",
    edge: "#3a150f",
  },
  bronze: {
    stops: ["#2e1a0c", "#6e4322", "#b9814d", "#f5d3a6", "#c48c55", "#7d4f2a", "#3c2312"],
    light: "#ffe7c7",
    edge: "#24140a",
  },
};

// Design space: the collage is laid out on a 1200 × 680 board and the camera scales it to fit.
const FOCUS = { x: 630, y: 336 };
const HOLE = { x: 520, y: 354, r: 11 };
const REST = { x: 470, y: 506, r: 37, s: 1 };
const INSERT = { x: HOLE.x, y: HOLE.y, r: 0, s: 0.64 };
const KEY_TIP = { x: 70, y: 392 };
const SLIDE = 44;

const MIN_LOAD_MS = 2800;
const SETTLE_MS = 1000;
const INSERT_MS = 1180;
const TURN_MS = 820;
const OPEN_MS = 1500;
const AFTER_MS = 1700;

// when each piece arrives, as a percentage of the load
const AT = {
  greet: 1,
  key: 6,
  sup: 14,
  mono: 24,
  tag: 33,
  script: 43,
  blob: 53,
  clock: 57,
  about: 64,
  sig: 78,
};

// #region timeline
export function skpClamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** The simulated load at time fraction t, as a percentage: eased, two soft stalls, never backwards. */
export function skpSimulated(t: number) {
  const k = skpClamp01(t);
  if (k >= 1) return 100;
  const ease = 1 - Math.pow(1 - k, 2.4);
  const stall = 0.035 * Math.sin(k * Math.PI * 3) * Math.sin(k * Math.PI);
  return Math.max(0, Math.min(100, (ease * 0.82 + k * 0.18 - stall) * 100));
}

export function skpPad(pct: number) {
  const n = Math.max(0, Math.min(100, Math.floor(pct)));
  return (n < 10 ? "00" : n < 100 ? "0" : "") + String(n);
}

/** The handwritten version: 0.0 → 0.9 while loading, the release at 100. */
export function skpVersion(pct: number, release: string) {
  if (pct >= 100) return release;
  return "0." + String(Math.max(0, Math.min(9, Math.floor(pct / 10))));
}

/** Cut the word four ways: pixel letter, superscript, two-letter monogram, the rest. */
export function skpSplit(word: string) {
  const w = Array.from(word.replace(/\s+/g, ""));
  return {
    pixel: (w[0] ?? "P").toUpperCase(),
    sup: w[1] ?? "",
    mono: w.slice(2, 4).join(""),
    script: w.slice(4).join(""),
  };
}

// 5 × 7 bitmap capitals and digits
const SKP_FONT: Record<string, string> = {
  A: "01110100011000111111100011000110001",
  B: "11110100011000111110100011000111110",
  C: "01110100011000010000100001000101110",
  D: "11110100011000110001100011000111110",
  E: "11111100001000011110100001000011111",
  F: "11111100001000011110100001000010000",
  G: "01110100011000010111100011000101111",
  H: "10001100011000111111100011000110001",
  I: "01110001000010000100001000010001110",
  J: "00111000100001000010000101001001100",
  K: "10001100101010011000101001001010001",
  L: "10000100001000010000100001000011111",
  M: "10001110111010110101100011000110001",
  N: "10001100011100110101100111000110001",
  O: "01110100011000110001100011000101110",
  P: "11110100011000111110100001000010000",
  Q: "01110100011000110001101011001001101",
  R: "11110100011000111110101001001010001",
  S: "01111100001000001110000010000111110",
  T: "11111001000010000100001000010000100",
  U: "10001100011000110001100011000101110",
  V: "10001100011000110001100010101000100",
  W: "10001100011000110101101011010101010",
  X: "10001100010101000100010101000110001",
  Y: "10001100010101000100001000010000100",
  Z: "11111000010001000100010001000011111",
  "0": "01110100011001110101110011000101110",
  "1": "00100011000010000100001000010001110",
  "2": "01110100010000100010001000100011111",
  "3": "11110000010000101110000010000111110",
  "4": "00010001100101010010111110001000010",
  "5": "11111100001111000001000011000101110",
  "6": "00110010001000011110100011000101110",
  "7": "11111000010001000100010000100001000",
  "8": "01110100011000101110100011000101110",
  "9": "01110100011000101111000010001001100",
};

/** The bitmap for a letter, emboldened to 6 wide (every stem two pixels). Unknown: a block. */
export function skpGlyph(ch: string) {
  const bits = SKP_FONT[ch.toUpperCase()] ?? "1".repeat(35);
  const rows: string[] = [];
  for (let r = 0; r < 7; r++) {
    const row = bits.slice(r * 5, r * 5 + 5) + "0";
    let out = "";
    for (let c = 0; c < 6; c++) out += row[c] === "1" || (c > 0 && row[c - 1] === "1") ? "1" : "0";
    rows.push(out);
  }
  return rows;
}

/** A small seeded PRNG (mulberry32). */
export function skpRand(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lit pixels of a glyph with the percentage each prints at, top to bottom like a print head. */
export function skpPixels(rows: string[], from: number, to: number) {
  const rand = skpRand(7);
  const cells: { col: number; row: number; at: number }[] = [];
  rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col++)
      if (line[col] === "1") cells.push({ col, row, at: row + col * 0.12 + rand() * 1.4 });
  });
  const order = cells.slice().sort((a, b) => a.at - b.at);
  const n = order.length;
  order.forEach((c, i) => {
    c.at = n <= 1 ? from : from + ((to - from) * i) / (n - 1);
  });
  return cells;
}

/** The board scale that fits the collage into a w × h gate. */
export function skpFit(w: number, h: number) {
  if (!(w > 0) || !(h > 0)) return 1;
  return Math.max(0.3, Math.min(1.7, w / 820, h / 590));
}

/** How far the camera zooms for the keyhole's round to cover the whole gate. */
export function skpZoomMax(w: number, h: number, s: number, r: number) {
  const half = Math.sqrt(w * w + h * h) / 2;
  return Math.max(1, (half * 1.08) / (r * Math.max(0.01, s)));
}

/** A board point seen from a key posed at (x, y), rotated r degrees, scaled s, in key units. */
export function skpToKey(
  px: number,
  py: number,
  x: number,
  y: number,
  r: number,
  s: number,
  tipX: number,
  tipY: number,
) {
  const a = (r * Math.PI) / 180;
  const dx = (px - x) / s;
  const dy = (py - y) / s;
  return {
    x: tipX + dx * Math.cos(a) + dy * Math.sin(a),
    y: tipY - dx * Math.sin(a) + dy * Math.cos(a),
  };
}

/** The keyhole: a round over a flared slot, grown by g on every side. */
export function skpHole(g: number) {
  const cx = 520;
  const cy = 354;
  const r = 11 + g;
  const hx = 6.5 + g * 0.6;
  const hy = cy + Math.sqrt(r * r - hx * hx);
  const bx = 9 + g;
  const by = 386 + g;
  const f = (n: number) => String(+n.toFixed(2));
  return `M${String(cx)} ${f(cy - r)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + hx)} ${f(hy)} L${f(cx + bx)} ${String(by)} H${f(cx - bx)} L${f(cx - hx)} ${f(hy)} A${f(r)} ${f(r)} 0 0 1 ${String(cx)} ${f(cy - r)} Z`;
}

export function skpEase(t: number) {
  const k = skpClamp01(t);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}
// #endregion

const SKP_CSS = `
.skp-root { position: relative; width: 100%; overflow: hidden; isolation: isolate; }
.skp-gate {
  position: absolute; inset: 0; z-index: 2; overflow: hidden; color: var(--skp-ink);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  user-select: none; -webkit-user-select: none; touch-action: manipulation; outline: none;
  animation: skp-fade 700ms ease both;
}
.skp-gate[data-reduced="true"][data-phase="open"] { opacity: 0; transition: opacity 700ms ease; }
.skp-paper { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; display: block; }
.skp-cap { transition: opacity 360ms ease; }
.skp-plug {
  fill: var(--skp-ink); transform-box: fill-box; transform-origin: 50% 40%;
  transform: scale(0); opacity: 0; transition: transform 640ms cubic-bezier(.2, 1.5, .4, 1), opacity 300ms ease;
}
.skp-gate[data-lock="true"] .skp-plug { transform: scale(1); opacity: 1; }
.skp-gate[data-phase="open"] .skp-plug, .skp-gate[data-phase="open"] .skp-cap { opacity: 0; transition: opacity 420ms ease; }

.skp-comp {
  position: absolute; left: 0; top: 0; width: 1200px; height: 680px; transform-origin: 0 0;
  opacity: 0; transition: opacity 400ms ease;
}
.skp-comp[data-ready="true"] { opacity: 1; }
.skp-shake { position: absolute; inset: 0; }
.skp-gate[data-phase="turn"] .skp-shake { animation: skp-shake 360ms 430ms cubic-bezier(.3, 0, .3, 1) both; }
.skp-abs { position: absolute; }
.skp-par { translate: calc(var(--skp-px, 0) * var(--d, 0) * 1px) calc(var(--skp-py, 0) * var(--d, 0) * 1px); }
.skp-dim { transition: opacity 600ms ease, filter 600ms ease; }
.skp-gate[data-lock="true"] .skp-dim { opacity: .1; filter: blur(1.5px); }
.skp-gate[data-phase="open"] .skp-dim, .skp-gate[data-phase="open"] .skp-dial { opacity: 0; transition: opacity 260ms ease; }

.skp-greet { left: 334px; top: 104px; font: 500 22px/1 var(--skp-grotesk); letter-spacing: -.01em; white-space: pre; }
.skp-ch { display: inline-block; opacity: 0; transform: translateY(.35em); transition: opacity 240ms ease, transform 380ms cubic-bezier(.2, 1.4, .4, 1); }
.skp-root [data-on="true"] .skp-ch { opacity: 1; transform: none; }

.skp-ver { left: 905px; top: 82px; width: 120px; height: 70px; }
.skp-ver-num { position: absolute; left: 14px; top: 2px; font: 500 50px/1 var(--skp-hand); transform: rotate(-7deg); white-space: nowrap; }
.skp-ver-num span { display: inline-block; animation: skp-flip 420ms cubic-bezier(.2, 1.5, .4, 1) both; }
.skp-ver svg { position: absolute; inset: -10px -14px; width: calc(100% + 28px); height: calc(100% + 20px); max-width: none; overflow: visible; }
.skp-ver path { fill: none; stroke: var(--skp-ink); stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }
.skp-ver[data-done="true"] path { stroke-dashoffset: 0; opacity: 1; transition: stroke-dashoffset 700ms 120ms cubic-bezier(.6, 0, .3, 1); }

.skp-pixel { left: 322px; top: 166px; width: 180px; height: 210px; }
.skp-px {
  position: absolute; width: 31px; height: 31px; background: var(--skp-ink); pointer-events: auto;
  transform: scale(.18); opacity: .1; border-radius: 1px;
  transition: transform 420ms cubic-bezier(.2, 1.6, .4, 1), opacity 160ms ease, background-color 900ms ease;
}
.skp-px[data-on="true"] { transform: none; opacity: 1; }
.skp-px[data-on="true"]:hover { background: var(--skp-glint); transform: translate(-3px, -3px); transition-duration: 120ms, 120ms, 60ms; }

.skp-sup { left: 516px; top: 172px; width: 64px; height: 64px; }
.skp-sup svg { width: 100%; height: 100%; max-width: none; overflow: visible; }
.skp-sup circle { fill: none; stroke: var(--skp-ink); stroke-width: 11; stroke-dasharray: 1.02 1.02; stroke-dashoffset: 1.02; opacity: 0; transition: stroke-dashoffset 900ms cubic-bezier(.6, 0, .2, 1), opacity 120ms ease; }
.skp-sup text { font: 500 58px/1 var(--skp-grotesk); fill: var(--skp-ink); opacity: 0; transition: opacity 500ms ease; }
.skp-sup[data-on="true"] circle { stroke-dashoffset: 0; opacity: 1; }
.skp-sup[data-on="true"] text { opacity: 1; }

.skp-dial { left: 400px; top: 242px; width: 240px; height: 240px; transition: opacity 400ms ease; }
.skp-dial svg { width: 100%; height: 100%; max-width: none; overflow: visible; }
.skp-dial-rot { transform-box: view-box; transform-origin: 50% 50%; transition: transform 300ms cubic-bezier(.2, 1.8, .4, 1); }
.skp-gate[data-phase="turn"] .skp-dial-rot, .skp-gate[data-phase="open"] .skp-dial-rot { transform: rotate(90deg); transition-delay: 430ms; }
.skp-ring { fill: none; stroke: var(--skp-ink); stroke-width: 2.6; stroke-linecap: round; }
.skp-ring-ghost { fill: none; stroke: var(--skp-ink); stroke-width: 1; opacity: .12; }
.skp-ticks line { stroke: var(--skp-ink); stroke-width: 2; stroke-linecap: round; opacity: 0; transition: opacity 300ms ease; }
.skp-gate[data-lock="true"] .skp-ticks line { opacity: .85; }
.skp-gate[data-phase="wait"] .skp-ticks line { opacity: .55; }
.skp-gate[data-phase="wait"] .skp-dial-rot { animation: skp-beckon 1600ms ease-in-out infinite; }
.skp-mono {
  font: 400 80px/1 var(--skp-grotesk); letter-spacing: -.04em; fill: none; stroke: var(--skp-ink); stroke-width: 2.2;
  stroke-dasharray: 420; stroke-dashoffset: 420; transition: stroke-dashoffset 1600ms cubic-bezier(.5, 0, .2, 1), opacity 420ms ease, transform 520ms ease;
  transform-box: fill-box; transform-origin: 50% 50%;
}
.skp-dial[data-on="true"] .skp-mono { stroke-dashoffset: 0; }
.skp-gate[data-lock="true"] .skp-mono { opacity: 0; transform: scale(.4) rotate(-30deg); }

.skp-tag { left: 784px; top: 160px; width: 210px; height: 150px; cursor: pointer; pointer-events: auto; }
.skp-tag-swoosh { position: absolute; left: 0; top: 0; width: 210px; height: 150px; max-width: none; overflow: visible; clip-path: inset(0 100% 0 0); transition: clip-path 900ms 160ms cubic-bezier(.7, 0, .2, 1); }
.skp-tag-swoosh path { fill: var(--skp-ink); }
.skp-tag[data-on="true"] .skp-tag-swoosh { clip-path: inset(-20% -20% -20% -20%); }
.skp-pill {
  position: absolute; left: 0; top: 0; width: 200px; height: 72px; border: 3.5px solid var(--skp-ink); border-radius: 999px;
  background: var(--skp-paper); display: flex; align-items: center; justify-content: center;
  font: 500 40px/1 var(--skp-grotesk); letter-spacing: -.02em; white-space: nowrap; overflow: hidden;
  opacity: 0; transform: translateY(-46px) rotate(-14deg) scale(.8);
  transition: opacity 260ms ease, transform 760ms cubic-bezier(.2, 1.5, .35, 1), background-color 220ms ease, color 220ms ease;
}
.skp-tag[data-on="true"] .skp-pill { opacity: 1; transform: none; }
.skp-tag:hover .skp-pill { background: var(--skp-ink); color: var(--skp-paper); }
.skp-tag:active .skp-pill { transform: scale(.95); }
.skp-pill span { display: inline-block; animation: skp-roll 520ms cubic-bezier(.2, 1.4, .4, 1) both; }

.skp-script { left: 596px; top: 248px; white-space: nowrap; }
.skp-script-in {
  font: 400 var(--skp-script-size, 172px)/1.25 var(--skp-script-face); padding: 0 .25em 0 .3em; margin-left: -.3em;
  clip-path: inset(-30% 100% -40% 0); transition: clip-path 1700ms cubic-bezier(.55, .05, .3, 1);
}
.skp-script[data-on="true"] .skp-script-in { clip-path: inset(-30% -10% -40% 0); }

.skp-blob { left: 252px; top: 412px; width: 220px; height: 150px; }
.skp-blob > svg { width: 100%; height: 100%; max-width: none; overflow: visible; }
.skp-blob-ink { fill: var(--skp-ink); clip-path: circle(0% at 14% 8%); transition: clip-path 1100ms cubic-bezier(.6, 0, .2, 1); }
.skp-blob[data-on="true"] .skp-blob-ink { clip-path: circle(150% at 14% 8%); }
.skp-clock { transform-box: fill-box; transform-origin: 50% 50%; transform: scale(0); transition: transform 620ms cubic-bezier(.2, 1.7, .4, 1); pointer-events: auto; }
.skp-blob[data-clock="true"] .skp-clock { transform: scale(1); }
.skp-clock circle:first-child { fill: var(--skp-ink); }
.skp-clock circle + circle { fill: none; stroke: var(--skp-paper); stroke-width: 3.2; }
.skp-hand { stroke: var(--skp-paper); stroke-width: 3.6; stroke-linecap: round; transform-box: view-box; transition: transform 380ms cubic-bezier(.3, 1.4, .5, 1); }
.skp-clock:hover .skp-hand-m { animation: skp-spin 700ms linear infinite; }

.skp-about { left: 600px; top: 452px; width: 290px; text-align: right; font: 500 21px/1.3 var(--skp-grotesk); letter-spacing: -.01em; }
.skp-about > div { white-space: pre; }
.skp-about i { font-style: normal; font-weight: 400; opacity: .55; }
.skp-caret {
  display: inline-block; width: 2px; height: .95em; margin-left: 3px; vertical-align: -.12em; background: var(--skp-ink);
  opacity: 0; transition: opacity 200ms ease;
}
.skp-about[data-on="true"] .skp-caret { opacity: 1; animation: skp-blink 1s steps(1) infinite; }

.skp-sig { left: 470px; top: 560px; width: 500px; text-align: center; font: 400 19px/1 var(--skp-grotesk); letter-spacing: .95em; white-space: nowrap; padding-left: .95em; }
.skp-sig span { display: inline-block; min-width: .6em; text-align: center; opacity: 0; transition: opacity 200ms ease; }
.skp-sig[data-on="true"] span { opacity: 1; }
.skp-sig span[data-locked="false"] { opacity: .45; }

.skp-keylayer { position: absolute; inset: 0; pointer-events: none; filter: drop-shadow(5px 12px 9px rgba(0, 0, 0, .26)); transition: opacity 300ms ease, filter 260ms ease; }
.skp-keylayer[data-lift="true"] { filter: drop-shadow(14px 30px 18px rgba(0, 0, 0, .22)); }
.skp-gate[data-phase="open"] .skp-keylayer { opacity: 0; transition-duration: 220ms; }
.skp-key { position: absolute; left: 0; top: 0; width: 140px; height: 400px; transform-origin: 0 0; will-change: transform; }
.skp-key-in { width: 100%; height: 100%; transform-origin: 70px 50%; }
.skp-key-in svg { width: 100%; height: 100%; max-width: none; overflow: visible; display: block; }
.skp-key-hit { pointer-events: visiblePainted; cursor: grab; touch-action: none; }
.skp-gate[data-drag="true"], .skp-gate[data-drag="true"] .skp-key-hit { cursor: grabbing; }
.skp-gate[data-lock="true"] .skp-key-hit { cursor: pointer; }

.skp-grain {
  position: absolute; inset: -50%; pointer-events: none; opacity: .07; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>");
  animation: skp-grain 900ms steps(4) infinite; transition: opacity 300ms ease;
}
.skp-gate[data-phase="open"] .skp-grain { opacity: 0; }

.skp-hud {
  position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 0 clamp(16px, 3vw, 36px) clamp(16px, 3vh, 30px); font: 400 11px/1.4 var(--skp-mono); letter-spacing: .14em;
  text-transform: uppercase; color: var(--skp-ink); pointer-events: none; transition: opacity 300ms ease;
}
.skp-hud > span { opacity: .62; white-space: nowrap; flex: 1 1 0; }
.skp-hud > span:nth-child(2) { text-align: center; }
.skp-hud > span:nth-child(3) { text-align: right; }
@media (max-width: 640px) { .skp-hud-links { display: none; } .skp-hud > span:nth-child(2) { text-align: right; } }
.skp-hud-hint { transition: opacity 400ms ease; }
.skp-hud-hint[data-off="true"] { opacity: 0 !important; }
.skp-gate[data-lock="true"] .skp-hud { opacity: 0; }
.skp-turn {
  position: absolute; left: 50%; bottom: clamp(16px, 3vh, 30px); translate: -50% 0; border: 1.5px solid var(--skp-ink); border-radius: 999px;
  background: var(--skp-paper); color: var(--skp-ink); padding: 10px 18px; font: 400 11px/1 var(--skp-mono); letter-spacing: .14em;
  text-transform: uppercase; cursor: pointer; animation: skp-rise 520ms cubic-bezier(.2, 1.4, .4, 1) both; white-space: nowrap;
}
.skp-turn:hover, .skp-turn:focus-visible { background: var(--skp-ink); color: var(--skp-paper); outline: none; }
.skp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.skp-after {
  position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
  background: var(--skp-ink); color: var(--skp-paper); text-align: center;
}
.skp-after-sig { font: 400 clamp(64px, 12vw, 170px)/1.2 var(--skp-script-face); padding: 0 .3em; animation: skp-fade 900ms 200ms ease both; }
.skp-after-about { font: 400 clamp(15px, 1.6vw, 19px)/1.5 var(--skp-grotesk); max-width: 44ch; text-wrap: balance; opacity: .85; animation: skp-fade 900ms 500ms ease both; }
.skp-after-k { font: 400 11px/1.4 var(--skp-mono); letter-spacing: .3em; text-transform: uppercase; opacity: .55; animation: skp-fade 900ms 800ms ease both; }

@keyframes skp-fade { from { opacity: 0; } }
@keyframes skp-flip { from { opacity: 0; transform: translateY(-.4em) rotate(-12deg); } }
@keyframes skp-roll { from { opacity: 0; transform: translateY(.8em); } }
@keyframes skp-rise { from { opacity: 0; translate: -50% 14px; } }
@keyframes skp-spin { to { transform: rotate(360deg); } }
@keyframes skp-blink { 50% { opacity: 0; } }
@keyframes skp-beckon { 50% { transform: scale(1.045) rotate(4deg); } }
@keyframes skp-grain { 25% { transform: translate(-3%, 2%); } 50% { transform: translate(2%, -3%); } 75% { transform: translate(-1%, -2%); } }
@keyframes skp-shake { 20% { transform: translate(-3px, 1px); } 45% { transform: translate(2px, -1px); } 70% { transform: translate(-1px, 0); } }

@media (prefers-reduced-motion: reduce) {
  .skp-gate, .skp-grain, .skp-shake, .skp-dial-rot, .skp-caret, .skp-after-sig, .skp-after-about, .skp-after-k, .skp-ver-num span, .skp-pill span, .skp-turn, .skp-clock:hover .skp-hand-m { animation: none !important; }
  .skp-par { translate: none; }
  .skp-ch, .skp-pill, .skp-px, .skp-clock, .skp-mono { transform: none !important; }
  .skp-script-in, .skp-tag-swoosh, .skp-blob-ink { clip-path: none !important; }
  .skp-script, .skp-tag, .skp-blob { opacity: 0; transition: opacity 600ms ease; }
  .skp-script[data-on="true"], .skp-tag[data-on="true"], .skp-blob[data-on="true"] { opacity: 1; }
}
`;

const css = (o: Record<string, string | number>) => o as React.CSSProperties;

/** The skeleton key, 140 × 400, tip at (70, 392), lit by one point light. */
function KeyArt({
  uid,
  metal,
  lightRef,
}: {
  uid: string;
  metal: Metal;
  lightRef: React.Ref<SVGFEPointLightElement>;
}) {
  const g = uid + "g";
  const sh = uid + "s";
  const f = uid + "f";
  const st = metal.stops;
  const fill = `url(#${g})`;
  return (
    <svg viewBox="0 0 140 400" aria-hidden="true" style={{ maxWidth: "none" }}>
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="130" y2="150">
          {st.map((c, i) => (
            <stop key={i} offset={(i / (st.length - 1)).toFixed(3)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={sh} gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="80" y2="0">
          <stop offset="0" stopColor={st[1]} />
          <stop offset=".3" stopColor={st[3]} />
          <stop offset=".55" stopColor={st[2]} />
          <stop offset="1" stopColor={st[6]} />
        </linearGradient>
        <filter
          id={f}
          x="-20%"
          y="-10%"
          width="140%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b" />
          <feSpecularLighting
            in="b"
            surfaceScale="5.5"
            specularConstant="1.25"
            specularExponent="22"
            lightingColor={metal.light}
            result="s"
          >
            <fePointLight ref={lightRef} x="40" y="60" z="150" />
          </feSpecularLighting>
          <feComposite in="s" in2="SourceAlpha" operator="in" result="s2" />
          <feDiffuseLighting
            in="b"
            surfaceScale="4"
            diffuseConstant="1.05"
            lightingColor="#ffffff"
            result="d"
          >
            <feDistantLight azimuth="235" elevation="48" />
          </feDiffuseLighting>
          <feComposite in="d" in2="SourceAlpha" operator="in" result="d2" />
          <feBlend in="SourceGraphic" in2="d2" mode="multiply" result="m" />
          <feComposite in="m" in2="s2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
      </defs>
      <g className="skp-key-hit" filter={`url(#${f})`}>
        {/* the bow: a trefoil loop around a fleur-de-lis */}
        <path
          d="M60 128 L52.9 109.4 A30 30 0 1 1 45.4 55.2 A30 30 0 1 1 94.6 55.2 A30 30 0 1 1 87.1 109.4 L80 128"
          fill="none"
          stroke={fill}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M70 26 C80 44 84 68 70 100 C56 68 60 44 70 26 Z" fill={fill} />
        <path
          d="M66 98 C58 76 42 70 33 82 C27 92 37 104 47 96 C46 103 54 107 66 103 Z"
          fill={fill}
        />
        <path
          d="M74 98 C82 76 98 70 107 82 C113 92 103 104 93 96 C94 103 86 107 74 103 Z"
          fill={fill}
        />
        <rect x="52" y="97" width="36" height="9" rx="3.5" fill={fill} />
        <path d="M62 106 L70 121 L78 106 Z" fill={fill} />
        <circle cx="70" cy="66" r="3.4" fill={fill} />
        {/* the collar */}
        <rect x="54" y="124" width="32" height="9" rx="4.5" fill={fill} />
        <rect x="59" y="134" width="22" height="11" rx="5.5" fill={fill} />
        <rect x="52" y="146" width="36" height="8" rx="4" fill={fill} />
        {/* the shaft, with a ring two-thirds down */}
        <rect x="62" y="152" width="16" height="238" rx="7" fill={`url(#${sh})`} />
        <rect x="58" y="246" width="24" height="8" rx="4" fill={fill} />
        <rect x="59" y="292" width="22" height="6" rx="3" fill={fill} />
        {/* the bit */}
        <path
          d="M76 316 H112 Q114 316 114 318 V330 H103 V341 H117 Q119 341 119 343 V357 H106 V366 H111 Q113 366 113 368 V382 Q113 386 109 386 H76 Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

/** The pill's ink shadow: an offset pill that drags off into a brush tail. */
function SwooshArt() {
  return (
    <svg className="skp-tag-swoosh" viewBox="0 0 210 150" aria-hidden="true">
      <path d="M48 14 H170 C192 14 210 31 210 52 C210 70 198 84 182 89 C160 97 142 104 128 118 C116 130 112 142 108 149 C104 132 112 110 128 96 C134 91 140 88 146 86 H48 C28 86 12 70 12 50 C12 30 28 14 48 14 Z" />
    </svg>
  );
}

/** The ink stroke along the bottom left, with the clock riding on it. */
function BlobArt({ pct, time }: { pct: number; time: { h: number; m: number } }) {
  // the hands wind from twelve to the visitor's own time as the page loads
  const k = skpEase(pct / 100);
  const m = (360 + time.m * 6) * k;
  const h = ((time.h % 12) * 30 + time.m * 0.5) * k;
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true">
      <path
        className="skp-blob-ink"
        d="M30 8 C46 4 58 14 54 30 C48 56 58 92 98 104 C136 115 176 104 204 82 C214 74 222 84 214 96 C186 134 124 150 76 134 C30 118 8 80 10 46 C11 26 18 11 30 8 Z"
      />
      <g className="skp-clock">
        <circle cx="112" cy="96" r="34" />
        <circle cx="112" cy="96" r="24" />
        <line
          className="skp-hand"
          x1="112"
          y1="96"
          x2="112"
          y2="82"
          style={{ transformOrigin: "112px 96px", transform: `rotate(${String(h)}deg)` }}
        />
        <g style={{ transformOrigin: "112px 96px", transform: `rotate(${String(m)}deg)` }}>
          <line
            className="skp-hand skp-hand-m"
            x1="112"
            y1="96"
            x2="112"
            y2="77"
            style={{ transformOrigin: "112px 96px" }}
          />
        </g>
      </g>
    </svg>
  );
}

/** Letters that roll through random glyphs before locking, left to right. */
function Scramble({ text, on }: { text: string; on: boolean }) {
  const chars = Array.from(text);
  const [tick, setTick] = React.useState(-1);
  React.useEffect(() => {
    if (!on) {
      setTick(-1);
      return;
    }
    let k = 0;
    setTick(0);
    const id = window.setInterval(() => {
      k += 1;
      setTick(k);
      if (k > chars.length + 8) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [on, text, chars.length]);
  const pool = "abcdefghijklmnopqrstuvwxyz*/#";
  return (
    <>
      {chars.map((c, i) => {
        const locked = tick - 8 >= i;
        const shown = locked || tick < 0 ? c : pool[(i * 7 + tick * 13) % pool.length];
        return (
          <span key={i} data-locked={locked || tick < 0}>
            {shown}
          </span>
        );
      })}
    </>
  );
}

function Typed({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span key={i} className="skp-ch" style={{ transitionDelay: `${String(delay + i * 32)}ms` }}>
          {c}
        </span>
      ))}
    </>
  );
}

type Phase = "fonts" | "load" | "settle" | "wait" | "insert" | "turn" | "open" | "after" | "done";

export function SkeletonKeyPreloader({
  children,
  loop = false,
  progress,
  durationMs = 6200,
  unlock = "auto",
  greeting = "welcome to my",
  word = "portfolio",
  tags = ["#portfolio"],
  name = "Portfolio",
  aboutLabel = "about/",
  about = [],
  links = [],
  signature = "",
  release = "1.0",
  metal = "gold",
  paper = "#fbfaf7",
  ink = "#0d0d0d",
  hud = true,
  grabLabel = "Grab the key ↗",
  fontHref = null,
  faces,
  height = "100svh",
  onComplete,
  className = "",
}: SkeletonKeyPreloaderProps) {
  const rawUid = React.useId();
  const uid = "skp" + rawUid.replace(/[^a-zA-Z0-9]/g, "");
  const metalSpec = METALS[metal];
  const parts = skpSplit(word || "portfolio");
  const pixels = React.useMemo(() => skpPixels(skpGlyph(parts.pixel), 3, 40), [parts.pixel]);
  const tagList = tags.length ? tags : ["#portfolio"];
  const scriptSize = Math.round(
    172 * Math.min(1, 5.4 / Math.max(1, Array.from(parts.script).length)),
  );

  const [phase, setPhase] = React.useState<Phase>(fontHref ? "fonts" : "load");
  const [pct, setPct] = React.useState(0);
  const [run, setRun] = React.useState(0);
  const [tag, setTag] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [time, setTime] = React.useState({ h: 10, m: 10 });

  const gateRef = React.useRef<HTMLDivElement>(null);
  const compRef = React.useRef<HTMLDivElement>(null);
  const paperRef = React.useRef<SVGSVGElement>(null);
  const keyRef = React.useRef<HTMLDivElement>(null);
  const keyInRef = React.useRef<HTMLDivElement>(null);
  const lightRef = React.useRef<SVGFEPointLightElement>(null);
  const ringRef = React.useRef<SVGCircleElement>(null);
  // latest props and state for the frame loop, which must not restart on every render
  const live = React.useRef({ onComplete, progress, phase, reduced });
  React.useLayoutEffect(() => {
    live.current = { onComplete, progress, phase, reduced };
  });

  // everything that moves every frame lives here, written straight to the DOM
  const sim = React.useRef({
    shown: 0,
    t0: 0,
    phaseAt: 0,
    w: 0,
    h: 0,
    s: 1,
    key: { x: 760, y: -260, r: -70, s: 1, vx: 0, vy: 0, vr: 0, vs: 0 },
    grab: null as null | {
      id: number;
      ox: number;
      oy: number;
      sx: number;
      sy: number;
      moved: boolean;
    },
    pointer: { x: 0, y: 0, on: false, nx: 0, ny: 0 },
    par: { x: 0, y: 0 },
    light: { x: 40, y: 60 },
    zoom: { z: 1, cx: FOCUS.x, cy: FOCUS.y },
  });

  React.useEffect(() => {
    const d = new Date();
    setTime({ h: d.getHours(), m: d.getMinutes() });
  }, [run]);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // the faces: a <link>, once per document; the collage holds until they land (or 1.6 s)
  React.useEffect(() => {
    if (!fontHref) {
      setPhase((p) => (p === "fonts" ? "load" : p));
      return;
    }
    if (!document.querySelector(`link[data-skp-fonts="${fontHref}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontHref;
      link.setAttribute("data-skp-fonts", fontHref);
      document.head.appendChild(link);
    }
    let alive = true;
    const go = () => {
      if (alive) setPhase((p) => (p === "fonts" ? "load" : p));
    };
    const timer = setTimeout(go, 1600);
    void Promise.all(FONT_PROBES.map((f) => document.fonts.load(f).catch(() => null))).then(go, go);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [fontHref]);

  // the camera's frame: the gate's size and the board scale that fits it
  React.useEffect(() => {
    const el = gateRef.current;
    if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      sim.current.w = b.width;
      sim.current.h = b.height;
      sim.current.s = skpFit(b.width, b.height);
      setReady(b.width > 0 && b.height > 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [run]);

  React.useEffect(() => {
    sim.current.phaseAt = performance.now();
    if (phase === "load") sim.current.t0 = performance.now();
  }, [phase, run]);

  const startUnlock = React.useCallback(() => {
    if (live.current.phase !== "wait") return;
    setPhase(live.current.reduced ? "open" : "insert");
  }, []);

  // settle → (wait) → insert → turn → open → done, or round again in a loop
  React.useEffect(() => {
    let t = 0;
    const r = reduced;
    if (phase === "settle")
      t = window.setTimeout(
        () => setPhase(unlock === "key" ? "wait" : r ? "open" : "insert"),
        SETTLE_MS,
      );
    else if (phase === "insert") t = window.setTimeout(() => setPhase("turn"), INSERT_MS);
    else if (phase === "turn") t = window.setTimeout(() => setPhase("open"), TURN_MS);
    else if (phase === "open")
      t = window.setTimeout(
        () => {
          if (loop) {
            setPhase("after");
            return;
          }
          setPhase("done");
          live.current.onComplete?.();
        },
        r ? 760 : OPEN_MS,
      );
    else if (phase === "after")
      t = window.setTimeout(() => {
        const k = sim.current;
        k.shown = 0;
        k.zoom = { z: 1, cx: FOCUS.x, cy: FOCUS.y };
        k.key = { x: 760, y: -260, r: -70, s: 1, vx: 0, vy: 0, vr: 0, vs: 0 };
        setPct(0);
        setTag(0);
        setRun((x) => x + 1);
        setPhase("load");
      }, AFTER_MS);
    return () => window.clearTimeout(t);
  }, [phase, unlock, loop, reduced]);

  // the frame loop: the count, the key's spring, the light, the parallax and the camera
  React.useEffect(() => {
    if (phase === "done" || phase === "after") return;
    let raf = 0;
    let last = performance.now();
    let shownInt = -1;
    const tick = (now: number) => {
      const k = sim.current;
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const ph = live.current.phase;
      const red = live.current.reduced;
      const el = now - k.phaseAt;

      if (ph === "load") {
        const real = live.current.progress;
        const target =
          real === undefined
            ? skpSimulated((now - k.t0) / Math.max(1500, durationMs))
            : Math.max(0, Math.min(100, real || 0));
        const step = Math.min((target - k.shown) * 0.12, (dt * 1000 * 100) / MIN_LOAD_MS);
        k.shown = Math.max(k.shown, k.shown + step);
        if (target >= 100 && k.shown > 99.6) k.shown = 100;
        if (k.shown >= 100) setPhase("settle");
      } else if (ph !== "fonts") k.shown = 100;
      const si = Math.floor(k.shown);
      if (si !== shownInt) {
        shownInt = si;
        setPct(si);
      }
      if (ringRef.current)
        ringRef.current.style.strokeDashoffset = (1 - skpClamp01((k.shown - 6) / 90)).toFixed(4);

      // the key
      const t = now / 1000;
      const key = k.key;
      let tx = REST.x;
      let ty = REST.y;
      let tr = REST.r;
      let ts = REST.s;
      let stiff = 120;
      let damp = 13;
      const locked = ph === "insert" || ph === "turn" || ph === "open";
      if (ph === "fonts" || (ph === "load" && k.shown < AT.key)) {
        tx = 760;
        ty = -260;
        tr = -70;
      } else if (locked) {
        tx = INSERT.x;
        ty = INSERT.y;
        tr = INSERT.r;
        ts = INSERT.s;
        stiff = 190;
        damp = 24;
      } else if (!red) {
        ty += Math.sin(t * 1.3) * 5;
        tr += Math.sin(t * 0.9) * 1.6;
        if (ph === "wait") {
          const nudge = Math.max(0, Math.sin(t * 2.6)) * 6;
          tx += nudge * 0.6;
          ty -= nudge;
        }
      }
      if (red) {
        key.x = tx;
        key.y = ty;
        key.r = tr;
        key.s = ts;
      } else if (k.grab) {
        const g = k.grab;
        const nx = k.pointer.x - g.ox;
        const ny = k.pointer.y - g.oy;
        const vx = (nx - key.x) / Math.max(dt, 0.001);
        key.vx = vx;
        key.vy = (ny - key.y) / Math.max(dt, 0.001);
        key.x += (nx - key.x) * 0.55;
        key.y += (ny - key.y) * 0.55;
        const want = REST.r + Math.max(-28, Math.min(28, vx * 0.03));
        key.vr += ((want - key.r) * 160 - key.vr * 16) * dt;
        key.r += key.vr * dt;
      } else {
        key.vx += ((tx - key.x) * stiff - key.vx * damp) * dt;
        key.vy += ((ty - key.y) * stiff - key.vy * damp) * dt;
        key.vr += ((tr - key.r) * stiff - key.vr * damp) * dt;
        key.vs += ((ts - key.s) * stiff - key.vs * damp) * dt;
        key.x += key.vx * dt;
        key.y += key.vy * dt;
        key.r += key.vr * dt;
        key.s += key.vs * dt;
      }
      const slide =
        ph === "insert"
          ? skpEase((el - 640) / 440) * SLIDE
          : ph === "turn" || ph === "open"
            ? SLIDE
            : 0;
      const turn = ph === "turn" ? skpEase(el / 600) * 84 : ph === "open" ? 84 : 0;
      if (keyRef.current) {
        keyRef.current.style.transform = `translate(${key.x.toFixed(2)}px,${(key.y + slide).toFixed(2)}px) rotate(${key.r.toFixed(2)}deg) scale(${key.s.toFixed(4)}) translate(-70px,-392px)`;
        keyRef.current.style.clipPath =
          slide > 0 ? `inset(-60px -60px ${(8 + slide / key.s).toFixed(2)}px -60px)` : "none";
        keyRef.current.style.opacity = ph === "fonts" ? "0" : "1";
      }
      if (keyInRef.current) {
        keyInRef.current.style.transform = turn
          ? `perspective(640px) rotateY(${turn.toFixed(2)}deg)`
          : "none";
        keyInRef.current.style.filter = turn
          ? `brightness(${(1 - turn / 220).toFixed(3)})`
          : "none";
      }

      // the light: the pointer, seen from the key; an idle sweep otherwise
      let lx = 70 + Math.sin(t * 0.8) * 120;
      let ly = 140 + Math.cos(t * 0.55) * 170;
      if (k.pointer.on) {
        const p = skpToKey(
          k.pointer.x,
          k.pointer.y,
          key.x,
          key.y + slide,
          key.r,
          key.s,
          KEY_TIP.x,
          KEY_TIP.y,
        );
        lx = p.x;
        ly = p.y;
      }
      k.light.x += (lx - k.light.x) * 0.12;
      k.light.y += (ly - k.light.y) * 0.12;
      if (lightRef.current) {
        lightRef.current.setAttribute("x", k.light.x.toFixed(1));
        lightRef.current.setAttribute("y", k.light.y.toFixed(1));
      }

      // the camera: fit, then dive through the keyhole
      const z0 = skpZoomMax(k.w, k.h, k.s, HOLE.r);
      if (ph === "open" && !red) {
        const p = skpClamp01(el / (OPEN_MS - 120));
        const e = skpEase(p);
        const zt = Math.exp(Math.log(z0) * Math.pow(p, 1.7));
        k.zoom.z = zt;
        // the keyhole travels to the centre of the frame as the camera closes in
        k.zoom.cx = HOLE.x - ((HOLE.x - FOCUS.x) * (1 - e)) / zt;
        k.zoom.cy = HOLE.y - ((HOLE.y - FOCUS.y) * (1 - e)) / zt;
      } else {
        k.zoom.z = 1;
        k.zoom.cx = FOCUS.x;
        k.zoom.cy = FOCUS.y;
      }
      const sz = k.s * k.zoom.z;
      if (compRef.current && k.w) {
        compRef.current.style.transform = `translate(${(k.w / 2).toFixed(2)}px,${(k.h / 2).toFixed(2)}px) scale(${sz.toFixed(5)}) translate(${(-k.zoom.cx).toFixed(3)}px,${(-k.zoom.cy).toFixed(3)}px)`;
        k.par.x += ((red ? 0 : k.pointer.nx) - k.par.x) * 0.08;
        k.par.y += ((red ? 0 : k.pointer.ny) - k.par.y) * 0.08;
        compRef.current.style.setProperty("--skp-px", k.par.x.toFixed(4));
        compRef.current.style.setProperty("--skp-py", k.par.y.toFixed(4));
      }
      if (paperRef.current && k.w) {
        const vw = k.w / sz;
        const vh = k.h / sz;
        paperRef.current.setAttribute(
          "viewBox",
          `${(k.zoom.cx - vw / 2).toFixed(4)} ${(k.zoom.cy - vh / 2).toFixed(4)} ${vw.toFixed(4)} ${vh.toFixed(4)}`,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, run, durationMs]);

  // pointer: the light source, the parallax, and dragging the key
  const toBoard = (e: React.PointerEvent) => {
    const g = gateRef.current;
    const k = sim.current;
    if (!g) return { x: 0, y: 0 };
    const b = g.getBoundingClientRect();
    const sz = k.s * k.zoom.z;
    return {
      x: k.zoom.cx + (e.clientX - b.left - b.width / 2) / sz,
      y: k.zoom.cy + (e.clientY - b.top - b.height / 2) / sz,
    };
  };
  const onMove = (e: React.PointerEvent) => {
    const k = sim.current;
    const p = toBoard(e);
    k.pointer.x = p.x;
    k.pointer.y = p.y;
    k.pointer.on = e.pointerType === "mouse" || !!k.grab;
    const gate = gateRef.current;
    if (k.w && gate) {
      const b = gate.getBoundingClientRect();
      k.pointer.nx = ((e.clientX - b.left) / b.width) * 2 - 1;
      k.pointer.ny = ((e.clientY - b.top) / b.height) * 2 - 1;
    }
    if (k.grab && Math.hypot(e.clientX - k.grab.sx, e.clientY - k.grab.sy) > 6) k.grab.moved = true;
  };
  const onLeave = () => {
    const k = sim.current;
    if (k.grab) return;
    k.pointer.on = false;
    k.pointer.nx = 0;
    k.pointer.ny = 0;
  };
  const canGrab = (ph: Phase) => ph === "load" || ph === "settle" || ph === "wait";
  const onKeyDown = (e: React.PointerEvent) => {
    const k = sim.current;
    if (reduced || !canGrab(live.current.phase) || k.shown < AT.key) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toBoard(e);
    k.pointer.x = p.x;
    k.pointer.y = p.y;
    k.pointer.on = true;
    k.grab = {
      id: e.pointerId,
      ox: p.x - k.key.x,
      oy: p.y - k.key.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    try {
      gateRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // the pointer went away between down and capture: the drag just ends early
    }
    setDrag(true);
  };
  const onUp = (e: React.PointerEvent) => {
    const k = sim.current;
    const g = k.grab;
    if (g?.id !== e.pointerId) return;
    k.grab = null;
    setDrag(false);
    if (e.pointerType !== "mouse") k.pointer.on = false;
    if (live.current.phase === "wait") {
      const near = Math.hypot(k.key.x - HOLE.x, k.key.y - HOLE.y) < 120;
      if (!g.moved || near) {
        startUnlock();
        return;
      }
    }
    // a tap jingles the key
    if (!g.moved) k.key.vr += 420 * (Math.random() > 0.5 ? 1 : -1);
  };
  const onGateKey = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && live.current.phase === "wait") {
      e.preventDefault();
      startUnlock();
    }
  };

  const done = phase === "done";
  const loading = phase === "fonts" || phase === "load";
  const lock = phase === "insert" || phase === "turn" || phase === "open";
  const on = (at: number) => phase !== "fonts" && pct >= at;
  const pixelsOn = phase !== "fonts";
  const verDone = !loading;
  const status =
    phase === "wait"
      ? ""
      : loading
        ? `Loading — ${skpPad(pct)}%`
        : lock
          ? "Unlocking"
          : "Ready — 100%";

  return (
    <div
      className={`skp-root ${className}`}
      style={css({
        height,
        "--skp-ink": ink,
        "--skp-paper": paper,
        "--skp-glint": metalSpec.stops[2] ?? ink,
        "--skp-grotesk":
          faces?.grotesk ?? '"Space Grotesk", "Helvetica Neue", Helvetica, Arial, sans-serif',
        "--skp-script-face":
          faces?.script ??
          '"Fleur De Leah", "Snell Roundhand", "Apple Chancery", "Brush Script MT", cursive',
        "--skp-hand": faces?.hand ?? 'Caveat, "Segoe Print", "Bradley Hand", cursive',
        "--skp-mono": faces?.mono ?? '"Space Mono", ui-monospace, Menlo, Consolas, monospace',
      })}
    >
      <style>{SKP_CSS}</style>
      {loop ? null : children}
      {loop && (phase === "open" || phase === "after") ? (
        <div className="skp-after" aria-hidden="true">
          <div className="skp-after-sig">{name.split(" ")[0]}</div>
          <div className="skp-after-about">{about.join(" ")}</div>
          <div className="skp-after-k">
            {word} {release} — unlocked
          </div>
        </div>
      ) : null}
      {done || phase === "after" ? null : (
        <div
          key={`run${String(run)}`}
          ref={gateRef}
          className="skp-gate"
          data-phase={phase}
          data-lock={lock}
          data-drag={drag}
          data-reduced={reduced}
          role="progressbar"
          aria-label={`Loading ${name} — ${word}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          tabIndex={phase === "wait" ? 0 : -1}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onGateKey}
        >
          <svg
            ref={paperRef}
            className="skp-paper"
            viewBox="0 0 1200 680"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill={paper}
              fillRule="evenodd"
              d={`M-30000 -30000 H30000 V30000 H-30000 Z ${skpHole(0)}`}
            />
            <path className="skp-cap" fill={paper} d={skpHole(1.2)} />
            <path className="skp-plug" d={skpHole(0)} />
          </svg>

          <div
            ref={compRef}
            className="skp-comp"
            data-ready={ready && phase !== "fonts"}
            aria-hidden="true"
          >
            <div className="skp-shake">
              <div
                className="skp-abs skp-greet skp-par skp-dim"
                data-on={on(AT.greet)}
                style={css({ "--d": 6 })}
              >
                <Typed text={greeting} />
              </div>

              <div
                className="skp-abs skp-ver skp-par skp-dim"
                data-done={verDone}
                style={css({ "--d": 10 })}
              >
                <div className="skp-ver-num">
                  <span key={skpVersion(pct, release)}>
                    {phase === "fonts" ? "" : skpVersion(verDone ? 100 : pct, release)}
                  </span>
                </div>
                <svg viewBox="0 0 148 90" aria-hidden="true">
                  <path
                    pathLength={1}
                    d="M118 22 C96 4 34 6 18 30 C2 56 40 80 84 76 C126 72 146 50 132 28 C124 16 104 10 88 12"
                  />
                </svg>
              </div>

              <div className="skp-abs skp-pixel skp-par skp-dim" style={css({ "--d": 14 })}>
                {pixels.map((p, i) => (
                  <span
                    key={i}
                    className="skp-px"
                    data-on={pixelsOn && pct >= p.at}
                    style={{ left: `${String(p.col * 30)}px`, top: `${String(p.row * 30)}px` }}
                  />
                ))}
              </div>

              {parts.sup ? (
                <div
                  className="skp-abs skp-sup skp-par skp-dim"
                  data-on={on(AT.sup)}
                  style={css({ "--d": 18 })}
                >
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    {parts.sup.toLowerCase() === "o" ? (
                      <circle cx="32" cy="32" r="19" pathLength={1} transform="rotate(-90 32 32)" />
                    ) : (
                      <text x="32" y="50" textAnchor="middle">
                        {parts.sup}
                      </text>
                    )}
                  </svg>
                </div>
              ) : null}

              <div
                className="skp-abs skp-dial skp-par"
                data-on={on(AT.mono)}
                style={css({ "--d": 9 })}
              >
                <svg viewBox="0 0 240 240" aria-hidden="true">
                  <g className="skp-dial-rot">
                    <circle className="skp-ring-ghost" cx="120" cy="120" r="76" />
                    <circle
                      ref={ringRef}
                      className="skp-ring"
                      cx="120"
                      cy="120"
                      r="76"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset="1"
                      transform="rotate(-90 120 120)"
                    />
                    <g className="skp-ticks">
                      {Array.from({ length: 24 }, (_, i) => {
                        const a = (i / 24) * Math.PI * 2;
                        const r1 = i % 6 === 0 ? 84 : 87;
                        return (
                          <line
                            key={i}
                            x1={(120 + Math.cos(a) * r1).toFixed(2)}
                            y1={(120 + Math.sin(a) * r1).toFixed(2)}
                            x2={(120 + Math.cos(a) * 92).toFixed(2)}
                            y2={(120 + Math.sin(a) * 92).toFixed(2)}
                            style={{ transitionDelay: `${String(i * 18)}ms` }}
                          />
                        );
                      })}
                    </g>
                  </g>
                  <text className="skp-mono" x="120" y="147" textAnchor="middle">
                    {parts.mono}
                  </text>
                </svg>
              </div>

              <div
                className="skp-abs skp-tag skp-par skp-dim"
                data-on={on(AT.tag)}
                style={css({ "--d": 22 })}
                onClick={() => setTag((x) => (x + 1) % tagList.length)}
              >
                <SwooshArt />
                <div className="skp-pill">
                  <span key={tag}>{tagList[tag % tagList.length]}</span>
                </div>
              </div>

              <div
                className="skp-abs skp-script skp-par skp-dim"
                data-on={on(AT.script)}
                style={css({ "--d": 12, "--skp-script-size": `${String(scriptSize)}px` })}
              >
                <div className="skp-script-in">{parts.script}</div>
              </div>

              <div
                className="skp-abs skp-blob skp-par skp-dim"
                data-on={on(AT.blob)}
                data-clock={on(AT.clock)}
                style={css({ "--d": 20 })}
              >
                <BlobArt pct={pct} time={time} />
              </div>

              <div
                className="skp-abs skp-about skp-par skp-dim"
                data-on={on(AT.about)}
                style={css({ "--d": 8 })}
              >
                {about.map((line, i) => {
                  const lead = i === 0 && aboutLabel ? aboutLabel + " " : "";
                  // each line starts typing where the one above it stopped
                  const typedBefore =
                    (aboutLabel ? aboutLabel.length + 1 : 0) + about.slice(0, i).join("").length;
                  return (
                    <div key={i}>
                      {lead ? (
                        <i>
                          <Typed text={lead} />
                        </i>
                      ) : null}
                      <Typed text={line} delay={typedBefore * 32 + i * 140} />
                      {i === about.length - 1 ? <span className="skp-caret" /> : null}
                    </div>
                  );
                })}
              </div>

              <div
                className="skp-abs skp-sig skp-par skp-dim"
                data-on={on(AT.sig)}
                style={css({ "--d": 5 })}
              >
                <Scramble text={signature} on={on(AT.sig)} />
              </div>

              <div className="skp-keylayer" data-lift={drag}>
                <div ref={keyRef} className="skp-key" style={{ opacity: 0 }}>
                  <div ref={keyInRef} className="skp-key-in" onPointerDown={onKeyDown}>
                    <KeyArt uid={uid} metal={metalSpec} lightRef={lightRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="skp-grain" aria-hidden="true" />

          {hud ? (
            <div className="skp-hud" aria-hidden="true">
              <span>{status}</span>
              <span className="skp-hud-hint" data-off={!loading || pct < AT.key + 4 || reduced}>
                {grabLabel}
              </span>
              <span className="skp-hud-links">{links.join("  ·  ")}</span>
            </div>
          ) : null}

          {phase === "wait" ? (
            <button type="button" className="skp-turn" onClick={startUnlock}>
              Turn the key — or drop it in the lock
            </button>
          ) : null}

          <span className="skp-sr" aria-live="polite">
            {phase === "wait" ? "Loaded. Press Enter to unlock." : loading ? "" : "Unlocked"}
          </span>
        </div>
      )}
    </div>
  );
}
