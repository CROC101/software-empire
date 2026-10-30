"use client";

import type { Season } from "@empire/core/theme";
import * as React from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";
import { useAmbience } from "./ambience";

/**
 * A tree on a little island in a pond, under the moon, dressed for the season. Its fruit are the
 * studio's systems: shake it (a tap, a fast sweep of the pointer, or shake the phone) and they
 * drop into the water, splash, and float there as links; they grow back after a while, or on
 * the next tap once they have all fallen. The pond mirrors the tree and the moon with a ripple,
 * and now and then a crocodile's eyes come up for a look.
 *
 * Canvas 2D, our own design (no library). The tree is grown from a fixed seed, so it is the same
 * tree on every visit; it grows in on first view and sways in the wind. Colours are palette
 * tokens; the look follows the ambience (season or festival) and the theme. Pauses off screen;
 * reduced motion shows the grown tree, still, and drops the fruit straight onto the water.
 */

export interface TreeFruit {
  id: string;
  label: string;
  href: string;
}

const TOKENS = [
  "--em-ink-0", // 0
  "--em-ink-100",
  "--em-ink-300",
  "--em-ink-600",
  "--em-ink-800",
  "--em-ink-950", // 5
  "--em-blue-500",
  "--em-blue-700",
  "--em-sky-500",
  "--em-violet-400",
  "--em-violet-500", // 10
  "--em-gold-300",
  "--em-gold-500",
  "--em-coral-400",
  "--em-coral-500",
  "--em-croc-400", // 15
  "--em-croc-600",
  "--em-croc-800",
  "--em-teal-400",
  "--em-teal-600",
  "--em-fuchsia-400", // 20
  "--em-fuchsia-500",
] as const;
const C = {
  white: 0,
  ink100: 1,
  ink300: 2,
  ink600: 3,
  ink800: 4,
  ink950: 5,
  blue: 6,
  blueDeep: 7,
  sky: 8,
  violet4: 9,
  violet5: 10,
  gold3: 11,
  gold5: 12,
  coral4: 13,
  coral5: 14,
  croc4: 15,
  croc6: 16,
  croc8: 17,
  teal4: 18,
  teal6: 19,
  pink4: 20,
  pink5: 21,
} as const;
const FRUIT_TONES = [C.blue, C.sky, C.violet5, C.teal4, C.coral5, C.gold5, C.pink5, C.croc4];

type Particle = "petal" | "drip" | "firefly" | "snow" | "spark" | "bat" | "splash";
interface Look {
  leaves: number[]; // token indexes; empty: bare branches
  density: number; // leaves per tip, roughly
  hang?: number[]; // hanging flower chains (golden shower)
  lanterns?: number; // hanging lanterns
  snow?: boolean;
  lights?: number[];
  star?: boolean;
  particle?: Particle;
  krathong?: boolean;
  twist: number; // 0 calm, 1 gnarled
  moon: number; // token for the moon's face at night
  moonSize: number; // share of the scene
}
const LOOKS: Record<Season, Look> = {
  // hot season: the golden shower tree (ราชพฤกษ์) in flower
  bloom: {
    leaves: [C.croc4, C.croc6],
    density: 2,
    hang: [C.gold3, C.gold5],
    particle: "petal",
    twist: 0.1,
    moon: C.gold3,
    moonSize: 0.085,
  },
  rain: {
    leaves: [C.croc4, C.croc6, C.teal4],
    density: 5,
    particle: "drip",
    twist: 0.05,
    moon: C.ink100,
    moonSize: 0.08,
  },
  snow: {
    leaves: [],
    density: 0,
    snow: true,
    particle: "snow",
    twist: 0.15,
    moon: C.ink100,
    moonSize: 0.085,
  },
  space: {
    leaves: [C.croc6, C.croc8, C.teal6],
    density: 4,
    particle: "firefly",
    twist: 0.1,
    moon: C.gold3,
    moonSize: 0.09,
  },
  halloween: {
    leaves: [C.coral4, C.coral5],
    density: 1,
    lanterns: C.coral5,
    particle: "bat",
    twist: 0.6,
    moon: C.coral4,
    moonSize: 0.12,
  },
  // full moon festival: krathong drift on the pond
  loykrathong: {
    leaves: [C.croc4, C.croc6, C.teal4],
    density: 4,
    particle: "firefly",
    krathong: true,
    twist: 0.1,
    moon: C.gold3,
    moonSize: 0.12,
  },
  christmas: {
    leaves: [],
    density: 0,
    snow: true,
    lights: [C.gold3, C.coral5, C.sky, C.croc4],
    star: true,
    particle: "snow",
    twist: 0.1,
    moon: C.ink100,
    moonSize: 0.08,
  },
  newyear: {
    leaves: [C.croc6, C.teal6],
    density: 3,
    lights: [C.gold3, C.pink4, C.sky],
    particle: "spark",
    twist: 0.1,
    moon: C.ink100,
    moonSize: 0.08,
  },
  songkran: {
    leaves: [C.pink4, C.coral4, C.pink5],
    density: 4,
    particle: "splash",
    twist: 0.1,
    moon: C.ink100,
    moonSize: 0.08,
  },
};

/* ── the tree ───────────────────────────────────────────────── */

const MAX_DEPTH = 7;
interface Seg {
  parent: number;
  depth: number;
  rel: number; // angle relative to the parent
  len: number; // share of the scene size
  width: number;
  bend: number;
  phase: number;
}
interface Leaf {
  seg: number;
  dx: number;
  dy: number;
  r: number;
  rot: number;
  tone: number; // index into the look's leaf list
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function growTree(twist: number) {
  const rand = rng(20_26);
  const segs: Seg[] = [
    { parent: -1, depth: 0, rel: -Math.PI / 2, len: 0.155, width: 0.034, bend: 0.08, phase: 0 },
  ];
  const tips: number[] = [];
  const branch = (p: number) => {
    const parent = segs[p];
    if (!parent) return;
    if (parent.depth >= MAX_DEPTH) {
      tips.push(p);
      return;
    }
    const n = parent.depth < 2 ? 2 : rand() < 0.38 ? 3 : 2;
    const spread = 0.36 + rand() * 0.22 + twist * 0.3;
    for (let k = 0; k < n; k++) {
      const side = k - (n - 1) / 2;
      segs.push({
        parent: p,
        depth: parent.depth + 1,
        // low branches stay closer to upright, so the crown is wide rather than flat
        rel: side * spread * (parent.depth < 1 ? 0.8 : 1) + (rand() - 0.5) * (0.28 + twist * 0.7),
        len: parent.len * (0.72 + rand() * 0.12),
        width: Math.max(0.0035, parent.width * 0.68),
        bend: (rand() - 0.5) * (0.35 + twist),
        phase: rand() * Math.PI * 2,
      });
      branch(segs.length - 1);
    }
  };
  branch(0);
  return { segs, tips, rand };
}

function leavesFor(tips: number[], segs: Seg[], look: Look, rand: () => number) {
  const leaves: Leaf[] = [];
  if (!look.leaves.length) return leaves;
  for (const t of tips) {
    const count = Math.round(look.density * (0.6 + rand() * 0.8));
    for (let i = 0; i < count; i++) {
      leaves.push({
        seg: t,
        dx: (rand() - 0.5) * 0.05,
        dy: (rand() - 0.6) * 0.05,
        r: 0.009 + rand() * 0.008,
        rot: rand() * Math.PI,
        tone: Math.floor(rand() * look.leaves.length),
      });
    }
    // a few along the twigs too, so the crown is not just a ring of tips
    const parent = segs[t]?.parent ?? -1;
    if (parent >= 0 && rand() < look.density / 5) {
      leaves.push({
        seg: parent,
        dx: (rand() - 0.5) * 0.04,
        dy: (rand() - 0.5) * 0.04,
        r: 0.01 + rand() * 0.008,
        rot: rand() * Math.PI,
        tone: Math.floor(rand() * look.leaves.length),
      });
    }
  }
  return leaves;
}

/* ── the scene ──────────────────────────────────────────────── */

interface FruitState {
  tip: number;
  phase: "hang" | "fall" | "float";
  x: number;
  y: number;
  vx: number;
  vy: number;
  slot: number; // where it floats, 0..1 across the pond
  grow: number; // 0..1 as it grows back
}
interface Mote {
  kind: Particle;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  tone: number;
  seed: number;
}
interface Ripple {
  x: number;
  y: number;
  r: number;
  life: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const HORIZON = 0.8; // share of the height where the pond starts
const REGROW_MS = 22_000;

export function SeasonTree({
  fruits,
  className,
  hint = "แตะหรือเขย่าต้นไม้ แล้วระบบจะหล่นลงน้ำ",
}: {
  fruits: readonly TreeFruit[];
  className?: string;
  /** Small caption under the scene. */
  hint?: string;
}) {
  const { season, dark } = useAmbience();
  const look = LOOKS[season ?? (dark ? "space" : "bloom")];
  const tokens = useTokenColors(TOKENS);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [fallen, setFallen] = React.useState<boolean[]>(() => fruits.map(() => false));

  React.useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx || !tokens) return;
    const col = (i: number) => tokens[i] ?? "#888888";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { segs, tips, rand } = growTree(look.twist);
    const leaves = leavesFor(tips, segs, look, rand);
    // fruit hang from tips spread across the crown, upper ones first
    const byX = [...tips].sort((a, b) => a - b);
    const fruitTips = fruits.map(
      (_, i) => byX[Math.floor(((i + 0.5) / fruits.length) * byX.length)] ?? 0,
    );
    const state: FruitState[] = fruitTips.map((tip, i) => ({
      tip,
      phase: "hang",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      slot: fruits.length > 1 ? 0.08 + (0.84 * i) / (fruits.length - 1) : 0.5,
      grow: 1,
    }));
    const motes: Mote[] = [];
    const ripples: Ripple[] = [];
    // positions, filled every frame
    const n = segs.length;
    const ax = new Float32Array(n);
    const ay = new Float32Array(n);
    const bx = new Float32Array(n);
    const by = new Float32Array(n);
    const ang = new Float32Array(n);
    const shown = new Float32Array(n);

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let onScreen = true;
    let last = performance.now();
    const born = last;
    let time = 0;
    let shake = 0; // 0..~2, decays
    let allFallenAt = 0;
    let crocUntil = 0;
    let crocNext = 4000 + rand() * 6000;
    const toggleFallen = () => {
      setFallen(state.map((f) => f.phase !== "hang"));
    };

    const pointer = { x: 0, y: 0, t: 0, in: false };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const now = performance.now();
      if (pointer.in && now - pointer.t < 80) {
        const v = Math.hypot(x - pointer.x, y - pointer.y) / Math.max(1, now - pointer.t);
        // a quick sweep through the crown shakes it
        if (v > 1.4 && y < H * HORIZON) shake = Math.min(2, shake + (v - 1.4) * 0.12);
      }
      pointer.x = x;
      pointer.y = y;
      pointer.t = now;
      pointer.in = true;
      kick();
    };
    const onLeave = () => {
      pointer.in = false;
    };
    let askedMotion = false;
    const onDown = () => {
      // iOS asks for motion access, and only from a tap
      const DM = window.DeviceMotionEvent as unknown as
        { requestPermission?: () => Promise<string> } | undefined;
      if (!askedMotion && typeof DM?.requestPermission === "function") {
        askedMotion = true;
        void DM.requestPermission().catch(() => undefined);
      }
      if (state.every((f) => f.phase === "float")) {
        regrow();
        return;
      }
      shake = Math.min(2, shake + 0.9);
      if (still) dropAll();
      kick();
    };
    let lastMag = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
      const jolt = Math.abs(mag - lastMag);
      lastMag = mag;
      if (jolt > 9) {
        shake = Math.min(2, shake + jolt * 0.04);
        if (still) dropAll();
        kick();
      }
    };
    const dropAll = () => {
      state.forEach((f, i) => {
        f.phase = "float";
        f.x = pondX(f.slot);
        f.y = H * (HORIZON + 0.08) + (i % 2) * 6;
      });
      allFallenAt = performance.now();
      toggleFallen();
    };
    const regrow = () => {
      for (const f of state) {
        f.phase = "hang";
        f.grow = still ? 1 : 0;
      }
      allFallenAt = 0;
      toggleFallen();
      kick();
    };
    const pondX = (slot: number) => W * (0.08 + slot * 0.84);

    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave, { passive: true });
    wrap.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("devicemotion", onMotion, { passive: true });

    /* layout: walk the tree, parents first */
    const layout = (S: number, baseX: number, baseY: number, grownT: number) => {
      for (let i = 0; i < n; i++) {
        const s = segs[i];
        if (!s) continue;
        const sway = still
          ? 0
          : Math.sin(time * 1.1 + s.phase) * 0.03 * ((s.depth + 1) / MAX_DEPTH) +
            shake * Math.sin(time * 11 + s.phase * 3) * 0.09 * (s.depth / MAX_DEPTH);
        const pa = s.parent >= 0 ? (ang[s.parent] ?? 0) : 0;
        const a = (s.parent >= 0 ? pa : 0) + s.rel + sway;
        ang[i] = a;
        const sx = s.parent >= 0 ? (bx[s.parent] ?? baseX) : baseX;
        const sy = s.parent >= 0 ? (by[s.parent] ?? baseY) : baseY;
        // grows in depth order: the trunk first, the twigs last
        const f = still ? 1 : clamp01((grownT * 1.35 - s.depth / MAX_DEPTH) / 0.32);
        shown[i] = f;
        const L = s.len * S * f;
        ax[i] = sx;
        ay[i] = sy;
        bx[i] = sx + Math.cos(a) * L;
        by[i] = sy + Math.sin(a) * L;
      }
    };

    const drawMoon = (S: number) => {
      const mx = W * 0.8;
      const my = H * 0.15;
      const r = S * look.moonSize;
      const glow = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 3.2);
      glow.addColorStop(0, withAlpha(col(dark ? look.moon : C.ink100), dark ? 0.32 : 0.35));
      glow.addColorStop(1, withAlpha(col(dark ? look.moon : C.ink100), 0));
      ctx.fillStyle = glow;
      ctx.fillRect(mx - r * 3.2, my - r * 3.2, r * 6.4, r * 6.4);
      const face = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, r * 0.1, mx, my, r);
      if (dark) {
        face.addColorStop(0, col(C.white));
        face.addColorStop(1, col(look.moon));
      } else {
        // a pale day moon
        face.addColorStop(0, col(C.white));
        face.addColorStop(1, col(C.ink300));
      }
      ctx.fillStyle = face;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
      if (!dark) {
        ctx.strokeStyle = withAlpha(col(C.blue), 0.25);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // a few soft maria
      ctx.fillStyle = withAlpha(col(dark ? C.ink300 : C.ink300), dark ? 0.22 : 0.18);
      for (const [dx, dy, rr] of [
        [-0.25, -0.1, 0.28],
        [0.2, 0.25, 0.18],
        [0.3, -0.3, 0.12],
      ] as const) {
        ctx.beginPath();
        ctx.arc(mx + dx * r, my + dy * r, rr * r, 0, Math.PI * 2);
        ctx.fill();
      }
      return { mx, my, r };
    };

    const drawTree = (S: number, moon: { mx: number; my: number }) => {
      // ink-800 either way: at night ink-950 vanishes into the page
      const bark = col(C.ink800);
      ctx.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const s = segs[i];
        if (!s || (shown[i] ?? 0) <= 0) continue;
        const x0 = ax[i] ?? 0;
        const y0 = ay[i] ?? 0;
        const x1 = bx[i] ?? 0;
        const y1 = by[i] ?? 0;
        const mx = (x0 + x1) / 2 + Math.cos((ang[i] ?? 0) + Math.PI / 2) * s.bend * s.len * S * 0.4;
        const my = (y0 + y1) / 2 + Math.sin((ang[i] ?? 0) + Math.PI / 2) * s.bend * s.len * S * 0.4;
        const w = Math.max(0.8, s.width * S * (0.6 + 0.4 * (shown[i] ?? 0)));
        ctx.strokeStyle = bark;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(mx, my, x1, y1);
        ctx.stroke();
        // rim light from the moon on the side that faces it
        const toMoon = Math.atan2(moon.my - y0, moon.mx - x0);
        const rx = Math.cos(toMoon) * w * 0.3;
        const ry = Math.sin(toMoon) * w * 0.3;
        ctx.strokeStyle = withAlpha(col(dark ? C.gold3 : C.white), dark ? 0.22 : 0.3);
        ctx.lineWidth = Math.max(0.6, w * 0.28);
        ctx.beginPath();
        ctx.moveTo(x0 + rx, y0 + ry);
        ctx.quadraticCurveTo(mx + rx, my + ry, x1 + rx, y1 + ry);
        ctx.stroke();
        if (look.snow && s.depth <= 5 && Math.abs(Math.cos(ang[i] ?? 0)) > 0.3) {
          ctx.strokeStyle = withAlpha(col(C.white), 0.92);
          ctx.lineWidth = Math.max(0.6, w * 0.42);
          ctx.beginPath();
          ctx.moveTo(x0, y0 - w * 0.42);
          ctx.quadraticCurveTo(mx, my - w * 0.42, x1, y1 - w * 0.42);
          ctx.stroke();
        }
      }
    };

    const drawCrown = (S: number) => {
      // leaves
      for (const l of leaves) {
        const f = shown[l.seg] ?? 0;
        if (f < 0.5) continue;
        const x = (bx[l.seg] ?? 0) + l.dx * S;
        const y = (by[l.seg] ?? 0) + l.dy * S;
        const r = l.r * S * Math.min(1, (f - 0.5) * 2);
        ctx.fillStyle = withAlpha(col(look.leaves[l.tone] ?? C.croc4), dark ? 0.85 : 0.92);
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.5, r, l.rot + (ang[l.seg] ?? 0) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      // golden shower: chains of yellow hanging from the tips, swinging
      if (look.hang) {
        tips.forEach((t, k) => {
          if (k % 2 || (shown[t] ?? 0) < 1) return;
          const x = bx[t] ?? 0;
          const y = by[t] ?? 0;
          const swing = Math.sin(time * 1.6 + k) * 0.18 + shake * Math.sin(time * 10 + k) * 0.3;
          const len = S * (0.05 + (k % 5) * 0.008);
          for (let j = 0; j < 7; j++) {
            const u = j / 6;
            const px = x + Math.sin(swing) * len * u;
            const py = y + Math.cos(swing) * len * u;
            ctx.fillStyle = col(look.hang?.[j % 2] ?? C.gold3);
            ctx.beginPath();
            ctx.arc(px, py, S * (0.0065 - u * 0.003), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      // lantern(s): halloween
      if (look.lanterns !== undefined) {
        tips.forEach((t, k) => {
          if (k % 7 !== 3 || (shown[t] ?? 0) < 1) return;
          const x = bx[t] ?? 0;
          const y = (by[t] ?? 0) + S * 0.03;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, S * 0.05);
          glow.addColorStop(0, withAlpha(col(C.gold3), 0.55));
          glow.addColorStop(1, withAlpha(col(C.gold3), 0));
          ctx.fillStyle = glow;
          ctx.fillRect(x - S * 0.05, y - S * 0.05, S * 0.1, S * 0.1);
          ctx.fillStyle = col(look.lanterns ?? C.coral5);
          ctx.beginPath();
          ctx.ellipse(x, y, S * 0.014, S * 0.012, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // string lights
      if (look.lights) {
        let k = 0;
        for (let i = 0; i < n; i++) {
          const s = segs[i];
          if (!s || s.depth < 2 || s.depth > 6 || (shown[i] ?? 0) < 1 || i % 3) continue;
          const tw = still ? 1 : 0.55 + 0.45 * Math.sin(time * 3 + i * 1.7);
          const x = ((ax[i] ?? 0) + (bx[i] ?? 0)) / 2;
          const y = ((ay[i] ?? 0) + (by[i] ?? 0)) / 2 + 2;
          ctx.fillStyle = withAlpha(col(look.lights[k++ % look.lights.length] ?? C.gold3), tw);
          ctx.beginPath();
          ctx.arc(x, y, S * 0.006, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (look.star) {
        let top = 0;
        for (let i = 1; i < n; i++) if ((by[i] ?? 0) < (by[top] ?? 0)) top = i;
        if ((shown[top] ?? 0) >= 1) star(bx[top] ?? 0, (by[top] ?? 0) - S * 0.02, S * 0.03);
      }
    };

    const star = (x: number, y: number, r: number) => {
      ctx.fillStyle = col(C.gold3);
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    };

    const fruitR = (S: number) => S * 0.022;
    const drawFruit = (x: number, y: number, S: number, tone: number, scale: number) => {
      const r = fruitR(S) * scale;
      if (r <= 0.3) return;
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, withAlpha(col(C.white), 0.9));
      g.addColorStop(0.35, col(tone));
      g.addColorStop(1, col(tone));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(col(dark ? C.ink950 : C.ink800), 0.5);
      ctx.lineWidth = Math.max(0.6, r * 0.12);
      ctx.stroke();
    };

    const drawIsland = (S: number, baseX: number, baseY: number) => {
      ctx.fillStyle = col(C.ink800);
      ctx.beginPath();
      ctx.ellipse(baseX, baseY + S * 0.012, S * 0.17, S * 0.04, 0, Math.PI, 0);
      ctx.fill();
      // grass tufts
      ctx.strokeStyle = withAlpha(col(dark ? C.croc6 : C.croc4), 0.8);
      ctx.lineWidth = 1.2;
      for (let k = -6; k <= 6; k++) {
        const x = baseX + k * S * 0.022;
        const sway = still ? 0 : Math.sin(time * 1.5 + k) * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, baseY - S * 0.004);
        ctx.lineTo(x + sway, baseY - S * (0.016 + (k & 1) * 0.008));
        ctx.stroke();
      }
    };

    const drawWater = (S: number) => {
      const top = H * HORIZON;
      // the reflection: the scene above the waterline, mirrored in thin strips that ripple
      const strip = 3;
      ctx.save();
      ctx.globalAlpha = dark ? 0.42 : 0.3;
      for (let d = 0; d < H - top; d += strip) {
        const sy = top - d - strip;
        if (sy < 0) break;
        const off = still ? 0 : Math.sin(d * 0.16 + time * 2.4) * (0.6 + d * 0.035);
        ctx.drawImage(
          canvas,
          0,
          Math.round(sy * dpr),
          canvas.width,
          Math.max(1, Math.round(strip * dpr)),
          off,
          top + d,
          W,
          strip,
        );
      }
      ctx.restore();
      const water = ctx.createLinearGradient(0, top, 0, H);
      water.addColorStop(0, withAlpha(col(dark ? C.blueDeep : C.sky), dark ? 0.35 : 0.18));
      water.addColorStop(1, withAlpha(col(dark ? C.ink950 : C.blue), dark ? 0.75 : 0.28));
      ctx.fillStyle = water;
      ctx.fillRect(0, top, W, H - top);
      // the waterline and a few glints
      ctx.strokeStyle = withAlpha(col(dark ? C.sky : C.blue), 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(W, top);
      ctx.stroke();
      ctx.strokeStyle = withAlpha(col(C.white), dark ? 0.25 : 0.55);
      for (let k = 0; k < 6; k++) {
        const y = top + (k + 1) * ((H - top) / 7);
        const x = ((time * (8 + k * 3) + k * 97) % (W + 80)) - 40;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + S * (0.04 + k * 0.006), y);
        ctx.stroke();
      }
      return top;
    };

    const spawn = (S: number) => {
      const p = look.particle;
      if (!p || still || motes.length > 46) return;
      const rate = p === "bat" ? 0.006 : p === "spark" ? 0.05 : p === "snow" ? 0.25 : 0.12;
      if (rand() > rate) return;
      const anyTip = tips[Math.floor(rand() * tips.length)] ?? 0;
      const tx = bx[anyTip] ?? W / 2;
      const ty = by[anyTip] ?? H / 2;
      const m: Mote = {
        kind: p,
        x: tx,
        y: ty,
        vx: 0,
        vy: 0,
        life: 0,
        max: 4,
        tone: C.white,
        seed: rand() * 100,
      };
      if (p === "petal") Object.assign(m, { vx: -6 + rand() * 4, vy: 14, tone: C.gold3, max: 6 });
      if (p === "drip") Object.assign(m, { vy: 30, tone: C.sky, max: 3 });
      if (p === "snow")
        Object.assign(m, { x: rand() * W, y: -4, vy: 14 + rand() * 10, tone: C.white, max: 12 });
      if (p === "firefly")
        Object.assign(m, {
          vx: (rand() - 0.5) * 8,
          vy: (rand() - 0.5) * 8,
          tone: rand() < 0.5 ? C.gold3 : C.sky,
          max: 5,
        });
      if (p === "spark")
        Object.assign(m, {
          x: W * (0.15 + rand() * 0.7),
          y: H * (0.1 + rand() * 0.3),
          tone: [C.gold3, C.pink4, C.sky][Math.floor(rand() * 3)] ?? C.gold3,
          max: 1.4,
        });
      if (p === "bat")
        Object.assign(m, {
          x: -20,
          y: H * (0.12 + rand() * 0.2),
          vx: S * 0.12,
          tone: C.ink950,
          max: 9,
        });
      if (p === "splash")
        Object.assign(m, { vx: (rand() - 0.5) * 30, vy: -20 - rand() * 20, tone: C.sky, max: 2.5 });
      motes.push(m);
    };

    const drawMotes = (dt: number, S: number, top: number) => {
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        if (!m) continue;
        m.life += dt;
        if (m.kind === "firefly") {
          m.vx += Math.sin(time * 2 + m.seed) * 6 * dt;
          m.vy += Math.cos(time * 1.7 + m.seed) * 6 * dt;
        } else if (m.kind === "splash") m.vy += 60 * dt;
        else if (m.kind === "petal" || m.kind === "snow") m.vx += Math.sin(time + m.seed) * 4 * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const fade = Math.min(1, m.life * 2, (m.max - m.life) * 1.5);
        if (m.life > m.max || m.x > W + 30 || m.y > H) {
          if ((m.kind === "drip" || m.kind === "petal") && m.y >= top)
            ripples.push({ x: m.x, y: m.y, r: 1, life: 0 });
          motes.splice(i, 1);
          continue;
        }
        if ((m.kind === "drip" || m.kind === "petal") && m.y >= top) {
          ripples.push({ x: m.x, y: top + 3 + rand() * 8, r: 1, life: 0 });
          motes.splice(i, 1);
          continue;
        }
        if (m.kind === "bat") {
          const flap = Math.sin(time * 14 + m.seed) * 0.6;
          ctx.fillStyle = withAlpha(col(dark ? C.ink950 : C.ink800), 0.9);
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.quadraticCurveTo(
            m.x - S * 0.02,
            m.y - S * 0.02 * flap,
            m.x - S * 0.035,
            m.y + S * 0.004,
          );
          ctx.quadraticCurveTo(m.x - S * 0.012, m.y + S * 0.002, m.x, m.y + S * 0.008);
          ctx.quadraticCurveTo(m.x + S * 0.012, m.y + S * 0.002, m.x + S * 0.035, m.y + S * 0.004);
          ctx.quadraticCurveTo(m.x + S * 0.02, m.y - S * 0.02 * flap, m.x, m.y);
          ctx.fill();
          continue;
        }
        const glow = m.kind === "firefly" || m.kind === "spark";
        const r = m.kind === "snow" ? 1.6 : m.kind === "petal" ? 2.2 : glow ? 1.8 : 1.4;
        if (glow) {
          const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 5);
          g.addColorStop(0, withAlpha(col(m.tone), 0.6 * fade));
          g.addColorStop(1, withAlpha(col(m.tone), 0));
          ctx.fillStyle = g;
          ctx.fillRect(m.x - r * 5, m.y - r * 5, r * 10, r * 10);
        }
        ctx.fillStyle = withAlpha(col(m.kind === "snow" && !dark ? C.ink300 : m.tone), fade);
        ctx.beginPath();
        if (m.kind === "petal") ctx.ellipse(m.x, m.y, r * 1.4, r * 0.8, m.life * 2, 0, Math.PI * 2);
        else ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawRipples = (dt: number) => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        if (!r) continue;
        r.life += dt;
        r.r += dt * 26;
        const a = 1 - r.life / 1.4;
        if (a <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = withAlpha(col(dark ? C.sky : C.blue), a * 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawKrathong = (S: number, top: number) => {
      for (let k = 0; k < 3; k++) {
        const x = ((time * (6 + k * 2) + k * 140) % (W + 60)) - 30;
        const y = top + (H - top) * (0.3 + k * 0.22) + (still ? 0 : Math.sin(time * 1.4 + k) * 1.5);
        const r = S * 0.022;
        ctx.fillStyle = col(C.croc4);
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // lotus petals
        ctx.fillStyle = col(C.pink4);
        for (let j = -2; j <= 2; j++) {
          ctx.beginPath();
          ctx.ellipse(x + j * r * 0.45, y - r * 0.35, r * 0.28, r * 0.5, j * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        // candle flame
        const fl = 0.8 + 0.2 * Math.sin(time * 12 + k);
        const g = ctx.createRadialGradient(x, y - r * 1.1, 0, x, y - r * 1.1, r * 1.6);
        g.addColorStop(0, withAlpha(col(C.gold3), 0.7 * fl));
        g.addColorStop(1, withAlpha(col(C.gold3), 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 1.6, y - r * 2.7, r * 3.2, r * 3.2);
        ctx.fillStyle = col(C.gold3);
        ctx.beginPath();
        ctx.ellipse(x, y - r * 1.05, r * 0.12, r * 0.3 * fl, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawCroc = (S: number, top: number, now: number) => {
      // the studio's croc surfaces now and then, looks, and goes under (sooner if shaken)
      if (still) return;
      if (now - born > crocNext && crocUntil === 0) crocUntil = now + 4200;
      if (crocUntil === 0) return;
      const left = crocUntil - now;
      if (left <= 0 || shake > 0.8) {
        crocUntil = 0;
        crocNext = now - born + 9000 + rand() * 9000;
        return;
      }
      const up = clamp01(Math.min((4200 - left) / 600, left / 600));
      const x = W * 0.82;
      const y = top + (H - top) * 0.45 - up * S * 0.012;
      const r = S * 0.016;
      ctx.fillStyle = withAlpha(col(dark ? C.croc8 : C.croc6), up);
      for (const dx of [-r * 1.3, r * 1.3]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y, r, r * 0.75 * up, 0, Math.PI, 0);
        ctx.fill();
      }
      const blink = (now / 1000) % 3 < 0.12 ? 0.15 : 1;
      ctx.fillStyle = withAlpha(col(C.gold3), up);
      for (const dx of [-r * 1.3, r * 1.3]) {
        ctx.beginPath();
        ctx.ellipse(x + dx, y - r * 0.35, r * 0.32, r * 0.32 * blink * up, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      shake *= Math.exp(-dt * 1.6);
      const S = Math.min(W, H);
      if (S <= 0) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const grownT = clamp01((now - born) / 2600);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const baseX = W * 0.44;
      const baseY = H * HORIZON;
      layout(S, baseX, baseY, grownT);
      const moon = drawMoon(S);
      drawTree(S, moon);
      drawCrown(S);

      // fruit: hang, fall, float
      const top = H * HORIZON;
      let dropped = false;
      for (const [i, f] of state.entries()) {
        const tone = FRUIT_TONES[i % FRUIT_TONES.length] ?? C.blue;
        if (f.phase === "hang") {
          f.grow = Math.min(1, f.grow + dt * 0.8);
          const t = f.tip;
          const swing = still
            ? 0
            : Math.sin(time * 1.8 + i) * 0.15 + shake * Math.sin(time * 12 + i) * 0.5;
          f.x = (bx[t] ?? 0) + Math.sin(swing) * fruitR(S) * 1.6;
          f.y = (by[t] ?? 0) + Math.cos(swing) * fruitR(S) * 1.6;
          const ripe = (shown[t] ?? 0) >= 1 ? f.grow : 0;
          // the stalk
          ctx.strokeStyle = withAlpha(col(dark ? C.ink300 : C.ink800), 0.7 * ripe);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx[t] ?? 0, by[t] ?? 0);
          ctx.lineTo(f.x, f.y);
          ctx.stroke();
          drawFruit(f.x, f.y, S, tone, ripe);
          // a hard shake shakes them loose, one by one
          if (!still && shake > 0.55 && ripe >= 1 && rand() < shake * 0.06) {
            f.phase = "fall";
            f.vx = (rand() - 0.5) * 40;
            f.vy = -20;
            dropped = true;
          }
        } else if (f.phase === "fall") {
          f.vy += S * 2.2 * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          drawFruit(f.x, f.y, S, tone, 1);
          if (f.y >= top + (H - top) * 0.35) {
            f.phase = "float";
            ripples.push({ x: f.x, y: f.y, r: 2, life: 0 });
            for (let k = 0; k < 6; k++) {
              motes.push({
                kind: "splash",
                x: f.x,
                y: f.y,
                vx: (rand() - 0.5) * 50,
                vy: -30 - rand() * 30,
                life: 0,
                max: 0.9,
                tone: C.sky,
                seed: k,
              });
            }
            dropped = true;
          }
        }
      }
      if (dropped) {
        toggleFallen();
        if (state.every((f) => f.phase === "float")) allFallenAt = now;
      }
      if (allFallenAt && now - allFallenAt > REGROW_MS) regrow();

      drawIsland(S, baseX, baseY);
      const waterTop = drawWater(S);
      if (look.krathong) drawKrathong(S, waterTop);
      // floating fruit drift to their places and bob
      state.forEach((f, i) => {
        if (f.phase !== "float") return;
        const tx = pondX(f.slot);
        const ty = waterTop + (H - waterTop) * (0.42 + (i % 2) * 0.22);
        f.x += (tx - f.x) * Math.min(1, dt * 1.4);
        f.y += (ty - f.y) * Math.min(1, dt * 2);
        const bob = still ? 0 : Math.sin(time * 2 + i) * 1.5;
        drawFruit(f.x, f.y + bob, S, FRUIT_TONES[i % FRUIT_TONES.length] ?? C.blue, 0.9);
      });
      drawRipples(dt);
      drawCroc(S, waterTop, now);
      spawn(S);
      drawMotes(dt, S, waterTop);

      // the links ride on the fruit
      state.forEach((f, i) => {
        const el = linkRefs.current[i];
        if (el) el.style.transform = `translate3d(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px, 0)`;
      });

      const busy = !still || grownT < 1 || shake > 0.01 || state.some((f) => f.phase === "fall");
      if (busy) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && onScreen) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e?.isIntersecting ?? true;
      if (onScreen) kick();
    });
    io.observe(wrap);
    const onVis = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVis);
    kick();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("pointerdown", onDown);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [tokens, look, dark, fruits]);

  return (
    <figure className={cn("relative mx-auto w-full", className)}>
      <div ref={wrapRef} className="stree relative aspect-square w-full touch-pan-y select-none">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
        {fruits.map((f, i) => (
          <a
            key={f.id}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            href={f.href}
            className="stree-fruit"
            data-fallen={fallen[i] || undefined}
          >
            <span>{f.label}</span>
          </a>
        ))}
      </div>
      {/* what fell, as plain links: labels on the water would crowd a phone screen */}
      <figcaption className="mt-2 flex min-h-7 flex-wrap items-center justify-center gap-1.5">
        {fallen.some(Boolean) ? (
          fruits.map((f, i) =>
            fallen[i] ? (
              <a key={f.id} href={f.href} className="stree-chip">
                {f.label}
              </a>
            ) : null,
          )
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {hint}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16) || 0;
  return `rgba(${String((n >> 16) & 255)},${String((n >> 8) & 255)},${String(n & 255)},${clamp01(a).toFixed(3)})`;
}
