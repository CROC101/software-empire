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
const HORIZON = 0.72; // share of the height where the water starts
const REGROW_MS = 22_000;
const STRIP = 6; // reflection strip height, px
// leaves behind the branches are a shade deeper, so the crown has volume
const BACK: Record<Season, number> = {
  bloom: C.croc8,
  rain: C.croc8,
  snow: C.croc8,
  space: C.croc8,
  halloween: C.coral5,
  loykrathong: C.croc8,
  christmas: C.croc8,
  newyear: C.croc8,
  songkran: C.pink5,
};

const canvasOf = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

export function SeasonTree({
  fruits,
  className,
  sceneClassName = "aspect-square",
  treeX = 0.5,
  hint = "แตะหรือเขย่าต้นไม้ แล้วระบบจะหล่นลงน้ำ",
}: {
  fruits: readonly TreeFruit[];
  className?: string;
  /** Size of the scene (the caption sits under it). */
  sceneClassName?: string;
  /** Where the trunk stands, as a share of the scene's width. */
  treeX?: number;
  /** Small caption under the scene. */
  hint?: string;
}) {
  const { season, dark } = useAmbience();
  const key: Season = season ?? (dark ? "space" : "bloom");
  const look = LOOKS[key];
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
    const n = segs.length;
    // batches: one path per depth for the wood, one per tone for the leaves (hundreds of separate
    // strokes and fills per frame were most of the cost on a phone)
    const byDepth: number[][] = Array.from({ length: MAX_DEPTH + 1 }, () => []);
    segs.forEach((s, i) => byDepth[s.depth]?.push(i));
    const depthWidth = byDepth.map((ids) => segs[ids[0] ?? 0]?.width ?? 0.004);
    const leafGroups = new Map<string, { back: boolean; tone: number; ids: Leaf[] }>();
    leaves.forEach((l, i) => {
      const back = i % 2 === 0;
      const tone = back ? BACK[key] : (look.leaves[l.tone] ?? C.croc4);
      const k = `${String(back)}:${String(tone)}`;
      const g = leafGroups.get(k) ?? { back, tone, ids: [] };
      g.ids.push(l);
      leafGroups.set(k, g);
    });
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
      slot: fruits.length > 1 ? i / (fruits.length - 1) : 0.5,
      grow: 1,
    }));
    const motes: Mote[] = [];
    const ripples: Ripple[] = [];
    const ax = new Float32Array(n);
    const ay = new Float32Array(n);
    const bx = new Float32Array(n);
    const by = new Float32Array(n);
    const ang = new Float32Array(n);
    const shown = new Float32Array(n);

    const bark = col(C.ink800);
    const rim = withAlpha(col(dark ? C.gold3 : C.white), dark ? 0.26 : 0.45);
    const snowCap = withAlpha(col(C.white), 0.92);

    // glow sprites, one per tone: drawImage instead of a new radial gradient per glow per frame
    const glows = new Map<number, HTMLCanvasElement>();
    const glow = (tone: number) => {
      let g = glows.get(tone);
      if (!g) {
        g = canvasOf(64, 64);
        const c = g.getContext("2d");
        if (c) {
          const r = c.createRadialGradient(32, 32, 0, 32, 32, 32);
          r.addColorStop(0, withAlpha(col(tone), 0.75));
          r.addColorStop(0.4, withAlpha(col(tone), 0.25));
          r.addColorStop(1, withAlpha(col(tone), 0));
          c.fillStyle = r;
          c.fillRect(0, 0, 64, 64);
        }
        glows.set(tone, g);
      }
      return g;
    };

    let W = 0;
    let H = 0;
    let S = 0;
    let top = 0;
    let dpr = 1;
    let baseX = 0;
    let moon = { x: 0, y: 0, r: 0 };
    let sky = canvasOf(1, 1); // moon, far shore, mist, island: redrawn on resize only
    let tint = canvasOf(1, 1); // the water's colour, over the reflection
    let refl = canvasOf(1, 1); // the scene above the water, flipped, at half size
    const fruitSprites = new Map<number, HTMLCanvasElement>();

    const fruitR = () => S * 0.03;
    const fruitSprite = (tone: number) => {
      let sp = fruitSprites.get(tone);
      if (sp) return sp;
      const r = fruitR();
      const size = r * 3.6 * dpr;
      sp = canvasOf(size, size);
      const c = sp.getContext("2d");
      if (c) {
        c.scale(dpr, dpr);
        const m = r * 1.8;
        // a glass drop: soft glow, tinted body, light on the moon side
        const halo = c.createRadialGradient(m, m, r * 0.6, m, m, r * 1.75);
        halo.addColorStop(0, withAlpha(col(tone), 0.35));
        halo.addColorStop(1, withAlpha(col(tone), 0));
        c.fillStyle = halo;
        c.fillRect(0, 0, m * 2, m * 2);
        const body = c.createRadialGradient(m + r * 0.3, m - r * 0.35, r * 0.1, m, m, r);
        body.addColorStop(0, withAlpha(col(C.white), 0.9));
        body.addColorStop(0.45, withAlpha(col(tone), 0.72));
        body.addColorStop(1, withAlpha(col(tone), 0.92));
        c.fillStyle = body;
        c.beginPath();
        c.arc(m, m, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = withAlpha(col(C.white), 0.75);
        c.lineWidth = r * 0.16;
        c.lineCap = "round";
        c.beginPath();
        c.arc(m, m, r * 0.8, -1.35, -0.15);
        c.stroke();
      }
      fruitSprites.set(tone, sp);
      return sp;
    };

    const hills = (amp: number, seed: number) => {
      const pts: [number, number][] = [];
      for (let x = 0; x <= W + 8; x += 8) {
        const u = x / Math.max(1, S);
        const h =
          amp *
          (0.55 +
            0.3 * Math.sin(u * 3.1 + seed) +
            0.15 * Math.sin(u * 7.3 + seed * 2.3) +
            0.08 * Math.sin(u * 17 + seed * 5));
        pts.push([x, top - Math.max(0, h) * S]);
      }
      return pts;
    };

    const buildStatic = () => {
      sky = canvasOf(W * dpr, H * dpr);
      const c = sky.getContext("2d");
      if (!c) return;
      c.scale(dpr, dpr);
      // the moon, its three-ring halo and the night (or day) around it
      const r = S * look.moonSize * 1.4;
      moon = {
        x: Math.min(W - r * 1.6, baseX + S * 0.3),
        y: Math.max(r * 1.4, H * 0.17),
        r,
      };
      const tone = col(dark ? look.moon : C.sky);
      for (const [from, to, a] of [
        [0.9, 4.5, dark ? 0.22 : 0.16],
        [0.95, 2.2, dark ? 0.3 : 0.2],
        [1, 1.35, dark ? 0.35 : 0.22],
      ] as const) {
        const g = c.createRadialGradient(moon.x, moon.y, r * from, moon.x, moon.y, r * to);
        g.addColorStop(0, withAlpha(tone, a));
        g.addColorStop(1, withAlpha(tone, 0));
        c.fillStyle = g;
        c.fillRect(moon.x - r * to, moon.y - r * to, r * to * 2, r * to * 2);
      }
      const face = c.createRadialGradient(
        moon.x - r * 0.3,
        moon.y - r * 0.3,
        r * 0.1,
        moon.x,
        moon.y,
        r,
      );
      face.addColorStop(0, col(C.white));
      face.addColorStop(1, dark ? col(look.moon) : col(C.ink100));
      c.fillStyle = face;
      c.beginPath();
      c.arc(moon.x, moon.y, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha(col(C.ink300), dark ? 0.22 : 0.16);
      for (const [dx, dy, rr] of [
        [-0.25, -0.1, 0.28],
        [0.2, 0.25, 0.18],
        [0.3, -0.3, 0.12],
      ] as const) {
        c.beginPath();
        c.arc(moon.x + dx * r, moon.y + dy * r, rr * r, 0, Math.PI * 2);
        c.fill();
      }
      // two far shores, the nearer one darker: depth for free
      for (const [amp, seed, tone2, a] of [
        [0.07, 1.7, dark ? C.ink800 : C.ink300, dark ? 0.55 : 0.5],
        [0.035, 4.2, dark ? C.ink800 : C.ink600, dark ? 0.85 : 0.35],
      ] as const) {
        c.fillStyle = withAlpha(col(tone2), a);
        c.beginPath();
        c.moveTo(0, top);
        for (const [x, y] of hills(amp, seed)) c.lineTo(x, y);
        c.lineTo(W + 8, top);
        c.closePath();
        c.fill();
      }
      // mist lying on the water
      const mist = c.createLinearGradient(0, top - S * 0.07, 0, top + S * 0.01);
      mist.addColorStop(0, withAlpha(col(dark ? C.sky : C.white), 0));
      mist.addColorStop(0.7, withAlpha(col(dark ? C.sky : C.white), dark ? 0.12 : 0.6));
      mist.addColorStop(1, withAlpha(col(dark ? C.sky : C.white), 0));
      c.fillStyle = mist;
      c.fillRect(0, top - S * 0.07, W, S * 0.08);
      // the island: a rock with a wet rim
      const iw = S * 0.17;
      c.fillStyle = bark;
      c.beginPath();
      c.moveTo(baseX - iw, top + 2);
      for (let k = 0; k <= 16; k++) {
        const u = k / 16;
        const x = baseX - iw + u * iw * 2;
        const lift = Math.sin(u * Math.PI) * S * (0.03 + 0.012 * Math.sin(u * 13 + 1.3));
        c.lineTo(x, top - lift);
      }
      c.lineTo(baseX + iw, top + 2);
      c.closePath();
      c.fill();
      c.strokeStyle = withAlpha(col(dark ? C.sky : C.white), 0.45);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(baseX - iw * 0.92, top);
      c.lineTo(baseX + iw * 0.92, top);
      c.stroke();

      const waterH = H - top;
      tint = canvasOf(W * dpr, waterH * dpr);
      const t = tint.getContext("2d");
      if (t) {
        t.scale(dpr, dpr);
        const water = t.createLinearGradient(0, 0, 0, waterH);
        water.addColorStop(0, withAlpha(col(dark ? C.blueDeep : C.sky), dark ? 0.4 : 0.3));
        water.addColorStop(0.5, withAlpha(col(dark ? C.blueDeep : C.blue), dark ? 0.6 : 0.4));
        water.addColorStop(1, withAlpha(col(dark ? C.ink950 : C.blueDeep), dark ? 0.85 : 0.55));
        t.fillStyle = water;
        t.fillRect(0, 0, W, waterH);
        // faint caustic streaks, the same slant as the theme-switch water
        t.strokeStyle = withAlpha(col(C.white), dark ? 0.05 : 0.12);
        t.lineWidth = 1.5;
        t.beginPath();
        for (let x = -waterH; x < W; x += 34) {
          t.moveTo(x, waterH);
          t.lineTo(x + waterH * 0.14, 0);
        }
        t.stroke();
      }
      refl = canvasOf((W * dpr) / 2, (top * dpr) / 2);
      fruitSprites.clear();
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      S = Math.min(W, H);
      top = H * HORIZON;
      baseX = W * treeX;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      buildStatic();
      kick();
    };

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
        if (v > 1.4 && y < top) shake = Math.min(2, shake + (v - 1.4) * 0.12);
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
    // fallen fruit float across the pond around the tree
    const pondX = (slot: number) =>
      Math.min(W - S * 0.06, Math.max(S * 0.06, baseX - S * 0.45 + slot * S * 0.9));
    const floatY = (i: number) => top + (H - top) * (0.3 + (i % 2) * 0.28);
    const dropAll = () => {
      state.forEach((f, i) => {
        f.phase = "float";
        f.x = pondX(f.slot);
        f.y = floatY(i);
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

    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave, { passive: true });
    wrap.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("devicemotion", onMotion, { passive: true });

    /* layout: walk the tree, parents first */
    const layout = (grownT: number) => {
      for (let i = 0; i < n; i++) {
        const s = segs[i];
        if (!s) continue;
        const sway = still
          ? 0
          : Math.sin(time * 1.1 + s.phase) * 0.03 * ((s.depth + 1) / MAX_DEPTH) +
            shake * Math.sin(time * 11 + s.phase * 3) * 0.09 * (s.depth / MAX_DEPTH);
        const a = (s.parent >= 0 ? (ang[s.parent] ?? 0) : 0) + s.rel + sway;
        ang[i] = a;
        const sx = s.parent >= 0 ? (bx[s.parent] ?? baseX) : baseX;
        const sy = s.parent >= 0 ? (by[s.parent] ?? top) : top - S * 0.02;
        // grows in depth order: the trunk first, the twigs last
        const f = still ? 1 : clamp01((grownT * 1.35 - s.depth / MAX_DEPTH) / 0.32);
        shown[i] = f;
        const L = s.len * S * 1.06 * f;
        ax[i] = sx;
        ay[i] = sy;
        bx[i] = sx + Math.cos(a) * L;
        by[i] = sy + Math.sin(a) * L;
      }
    };

    const curve = (i: number, dx: number, dy: number) => {
      const s = segs[i];
      if (!s) return;
      const x0 = (ax[i] ?? 0) + dx;
      const y0 = (ay[i] ?? 0) + dy;
      const x1 = (bx[i] ?? 0) + dx;
      const y1 = (by[i] ?? 0) + dy;
      const bend = s.bend * s.len * S * 0.45;
      const n2 = (ang[i] ?? 0) + Math.PI / 2;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(
        (x0 + x1) / 2 + Math.cos(n2) * bend,
        (y0 + y1) / 2 + Math.sin(n2) * bend,
        x1,
        y1,
      );
    };

    const drawLeaves = (back: boolean) => {
      for (const g of leafGroups.values()) {
        if (g.back !== back) continue;
        ctx.fillStyle = withAlpha(col(g.tone), back ? 0.95 : 0.9);
        ctx.beginPath();
        for (const l of g.ids) {
          const f = shown[l.seg] ?? 0;
          if (f < 0.5) continue;
          const x = (bx[l.seg] ?? 0) + l.dx * S * (back ? 1.2 : 1);
          const y = (by[l.seg] ?? 0) + l.dy * S * (back ? 1.2 : 1) - (back ? S * 0.006 : 0);
          const r = l.r * S * 1.15 * Math.min(1, (f - 0.5) * 2);
          const rot = l.rot + (ang[l.seg] ?? 0) * 0.3;
          ctx.moveTo(x + Math.cos(rot) * r * 1.5, y + Math.sin(rot) * r * 1.5);
          ctx.ellipse(x, y, r * 1.5, r, rot, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    const drawTree = () => {
      ctx.lineCap = "round";
      // a flared foot where the trunk meets the rock
      const w0 = (depthWidth[0] ?? 0.034) * S;
      const fh = S * 0.06;
      ctx.fillStyle = bark;
      ctx.beginPath();
      ctx.moveTo(baseX - w0 * 1.9, top - S * 0.012);
      ctx.quadraticCurveTo(baseX - w0 * 0.55, top - S * 0.02, baseX - w0 * 0.5, top - fh);
      ctx.lineTo(baseX + w0 * 0.5, top - fh);
      ctx.quadraticCurveTo(baseX + w0 * 0.55, top - S * 0.02, baseX + w0 * 1.9, top - S * 0.012);
      ctx.closePath();
      ctx.fill();
      for (let d = 0; d <= MAX_DEPTH; d++) {
        const ids = byDepth[d] ?? [];
        const w = Math.max(0.8, (depthWidth[d] ?? 0.004) * S * 1.1);
        ctx.strokeStyle = bark;
        ctx.lineWidth = w;
        ctx.beginPath();
        for (const i of ids) if ((shown[i] ?? 0) > 0) curve(i, 0, 0);
        ctx.stroke();
        // rim light on the side that faces the moon
        const toMoon = Math.atan2(moon.y - top * 0.6, moon.x - baseX);
        ctx.strokeStyle = rim;
        ctx.lineWidth = Math.max(0.6, w * 0.28);
        ctx.beginPath();
        for (const i of ids)
          if ((shown[i] ?? 0) > 0) curve(i, Math.cos(toMoon) * w * 0.3, Math.sin(toMoon) * w * 0.3);
        ctx.stroke();
        if (look.snow && d <= 5) {
          ctx.strokeStyle = snowCap;
          ctx.lineWidth = Math.max(0.6, w * 0.42);
          ctx.beginPath();
          for (const i of ids)
            if ((shown[i] ?? 0) > 0 && Math.abs(Math.cos(ang[i] ?? 0)) > 0.3)
              curve(i, 0, -w * 0.42);
          ctx.stroke();
        }
      }
    };

    const drawCrownExtras = () => {
      // golden shower: chains of yellow hanging from the tips, swinging
      if (look.hang) {
        for (let j = 0; j < 2; j++) {
          ctx.fillStyle = col(look.hang[j] ?? C.gold3);
          ctx.beginPath();
          tips.forEach((t, k) => {
            if (k % 2 || (shown[t] ?? 0) < 1) return;
            const x = bx[t] ?? 0;
            const y = by[t] ?? 0;
            const swing = Math.sin(time * 1.6 + k) * 0.18 + shake * Math.sin(time * 10 + k) * 0.3;
            const len = S * (0.06 + (k % 5) * 0.01);
            for (let q = j; q < 8; q += 2) {
              const u = q / 7;
              const px = x + Math.sin(swing) * len * u;
              const py = y + Math.cos(swing) * len * u;
              const r = S * (0.0075 - u * 0.0035);
              ctx.moveTo(px + r, py);
              ctx.arc(px, py, r, 0, Math.PI * 2);
            }
          });
          ctx.fill();
        }
      }
      if (look.lanterns !== undefined) {
        const lit = tips.filter((t, k) => k % 7 === 3 && (shown[t] ?? 0) >= 1);
        const g = glow(C.gold3);
        for (const t of lit) {
          const x = bx[t] ?? 0;
          const y = (by[t] ?? 0) + S * 0.03;
          ctx.drawImage(g, x - S * 0.05, y - S * 0.05, S * 0.1, S * 0.1);
        }
        ctx.fillStyle = col(look.lanterns);
        ctx.beginPath();
        for (const t of lit) {
          const x = bx[t] ?? 0;
          const y = (by[t] ?? 0) + S * 0.03;
          ctx.moveTo(x + S * 0.014, y);
          ctx.ellipse(x, y, S * 0.014, S * 0.012, 0, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      if (look.lights) {
        const lights = look.lights;
        lights.forEach((tone, j) => {
          ctx.fillStyle = col(tone);
          ctx.beginPath();
          let k = 0;
          for (let i = 0; i < n; i++) {
            const s = segs[i];
            if (!s || s.depth < 2 || s.depth > 6 || (shown[i] ?? 0) < 1 || i % 3) continue;
            if (k++ % lights.length !== j) continue;
            const tw = still ? 1 : 0.6 + 0.4 * Math.sin(time * 3 + i * 1.7);
            const x = ((ax[i] ?? 0) + (bx[i] ?? 0)) / 2;
            const y = ((ay[i] ?? 0) + (by[i] ?? 0)) / 2 + 2;
            const r = S * 0.0065 * tw;
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, Math.PI * 2);
          }
          ctx.fill();
        });
      }
      if (look.star) {
        let topSeg = 0;
        for (let i = 1; i < n; i++) if ((by[i] ?? 0) < (by[topSeg] ?? 0)) topSeg = i;
        if ((shown[topSeg] ?? 0) >= 1) {
          const x = bx[topSeg] ?? 0;
          const y = (by[topSeg] ?? 0) - S * 0.025;
          const g = glow(C.gold3);
          ctx.drawImage(g, x - S * 0.07, y - S * 0.07, S * 0.14, S * 0.14);
          star(x, y, S * 0.035);
        }
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

    const drawFruit = (x: number, y: number, i: number, scale: number) => {
      if (scale <= 0.02) return;
      const sp = fruitSprite(FRUIT_TONES[i % FRUIT_TONES.length] ?? C.blue);
      const size = fruitR() * 3.6 * scale;
      ctx.drawImage(sp, x - size / 2, y - size / 2, size, size);
    };

    const drawReeds = () => {
      for (const [tone, from] of [
        [dark ? C.croc8 : C.croc6, 0],
        [dark ? C.croc6 : C.croc4, 1],
      ] as const) {
        ctx.strokeStyle = withAlpha(col(tone), 0.9);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let k = -9 + from; k <= 9; k += 2) {
          const x = baseX + k * S * 0.017;
          const h = S * (0.03 + ((k * 7 + 20) % 5) * 0.006);
          const sway = still
            ? 0
            : Math.sin(time * 1.5 + k) * 2 + shake * Math.sin(time * 9 + k) * 4;
          ctx.moveTo(x, top - S * 0.004);
          ctx.quadraticCurveTo(x + sway * 0.4, top - h * 0.6, x + sway, top - h);
        }
        ctx.stroke();
      }
    };

    const drawWater = () => {
      const waterH = H - top;
      // the reflection: the scene above the waterline, flipped once into a half-size canvas,
      // then laid on the water in strips that ripple
      const rc = refl.getContext("2d");
      if (rc && refl.height > 1) {
        rc.setTransform(1, 0, 0, -1, 0, refl.height);
        rc.clearRect(0, 0, refl.width, refl.height);
        rc.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          Math.round(top * dpr),
          0,
          0,
          refl.width,
          refl.height,
        );
        const k = refl.height / top;
        ctx.globalAlpha = dark ? 0.5 : 0.38;
        for (let d = 0; d < waterH && d < top; d += STRIP) {
          const off = still ? 0 : Math.sin(d * 0.12 + time * 2.4) * (0.8 + d * 0.035);
          ctx.drawImage(refl, 0, d * k, refl.width, STRIP * k, off, top + d, W, STRIP);
        }
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(tint, 0, top, W, waterH);
      // a moonlit path under the moon
      ctx.strokeStyle = col(dark ? C.gold3 : C.white);
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 12; k++) {
        const y = top + 5 + k * (waterH / 12.5);
        const f = still ? 0.8 : 0.55 + 0.45 * Math.sin(time * 3 + k * 1.7);
        const w = S * 0.045 * (1 - k / 16) * f;
        const x = moon.x + (still ? 0 : Math.sin(time * 1.3 + k) * 3);
        ctx.globalAlpha = (dark ? 0.6 : 0.75) * (1 - k / 14);
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // the waterline: a living wave, not a ruled line
      ctx.strokeStyle = withAlpha(col(dark ? C.sky : C.white), dark ? 0.55 : 0.9);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= W + 12; x += 12) {
        const y =
          top +
          (still
            ? 0
            : Math.sin(x * 0.02 + time * 1.2) * 1.3 + Math.sin(x * 0.051 - time * 0.8) * 0.8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const spawn = () => {
      const p = look.particle;
      if (!p || still || motes.length > 46) return;
      const rate = p === "bat" ? 0.006 : p === "spark" ? 0.05 : p === "snow" ? 0.25 : 0.12;
      if (rand() > rate) return;
      const anyTip = tips[Math.floor(rand() * tips.length)] ?? 0;
      const m: Mote = {
        kind: p,
        x: bx[anyTip] ?? W / 2,
        y: by[anyTip] ?? H / 2,
        vx: 0,
        vy: 0,
        life: 0,
        max: 4,
        tone: C.white,
        seed: rand() * 100,
      };
      if (p === "petal") Object.assign(m, { vx: -6 + rand() * 4, vy: 14, tone: C.gold3, max: 6 });
      if (p === "drip") Object.assign(m, { vy: 30, tone: C.sky, max: 3 });
      // snow across the whole sky, fading in where it starts
      if (p === "snow")
        Object.assign(m, { x: rand() * W, y: rand() * top * 0.9, vy: 14 + rand() * 10, max: 8 });
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
        Object.assign(m, { x: -20, y: H * (0.12 + rand() * 0.2), vx: S * 0.12, max: 9 });
      if (p === "splash")
        Object.assign(m, { vx: (rand() - 0.5) * 30, vy: -20 - rand() * 20, tone: C.sky, max: 2.5 });
      motes.push(m);
    };

    const drawMotes = (dt: number) => {
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
        const wet = (m.kind === "drip" || m.kind === "petal") && m.y >= top;
        if (m.life > m.max || m.x > W + 30 || m.y > H || wet) {
          if (wet) ripples.push({ x: m.x, y: top + 3 + rand() * 8, r: 1, life: 0 });
          motes.splice(i, 1);
          continue;
        }
        const fade = Math.min(1, m.life * 2, (m.max - m.life) * 1.5);
        if (m.kind === "bat") {
          const flap = Math.sin(time * 14 + m.seed) * 0.6;
          ctx.fillStyle = bark;
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
        ctx.globalAlpha = fade;
        if (m.kind === "firefly" || m.kind === "spark") {
          ctx.drawImage(glow(m.tone), m.x - 9, m.y - 9, 18, 18);
        } else {
          ctx.fillStyle = col(m.kind === "snow" && !dark ? C.ink300 : m.tone);
          ctx.beginPath();
          if (m.kind === "petal") ctx.ellipse(m.x, m.y, 3, 1.8, m.life * 2, 0, Math.PI * 2);
          else ctx.arc(m.x, m.y, m.kind === "snow" ? 1.7 : 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };

    const drawRipples = (dt: number) => {
      ctx.strokeStyle = col(dark ? C.sky : C.white);
      ctx.lineWidth = 1;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        if (!r) continue;
        r.life += dt;
        r.r += dt * 28;
        const a = 1 - r.life / 1.4;
        if (a <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = a * 0.7;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawKrathong = () => {
      const g = glow(C.gold3);
      for (let k = 0; k < 3; k++) {
        const x = ((time * (6 + k * 2) + k * 160) % (W + 60)) - 30;
        const y = top + (H - top) * (0.3 + k * 0.22) + (still ? 0 : Math.sin(time * 1.4 + k) * 1.5);
        const r = S * 0.024;
        ctx.fillStyle = col(C.croc4);
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.4, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = col(C.pink4);
        ctx.beginPath();
        for (let j = -2; j <= 2; j++) {
          const px = x + j * r * 0.45;
          ctx.moveTo(px + r * 0.28, y - r * 0.35);
          ctx.ellipse(px, y - r * 0.35, r * 0.28, r * 0.5, j * 0.35, 0, Math.PI * 2);
        }
        ctx.fill();
        const fl = 0.8 + 0.2 * Math.sin(time * 12 + k);
        ctx.globalAlpha = fl;
        ctx.drawImage(g, x - r * 1.8, y - r * 2.9, r * 3.6, r * 3.6);
        ctx.globalAlpha = 1;
        ctx.fillStyle = col(C.gold3);
        ctx.beginPath();
        ctx.ellipse(x, y - r * 1.05, r * 0.12, r * 0.3 * fl, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawCroc = (now: number) => {
      // the studio's croc glides past now and then, a V of wake behind it (it dives if shaken)
      if (still) return;
      if (now - born > crocNext && crocUntil === 0) crocUntil = now + 6000;
      if (crocUntil === 0) return;
      const left = crocUntil - now;
      if (left <= 0 || shake > 0.8) {
        crocUntil = 0;
        crocNext = now - born + 9000 + rand() * 9000;
        return;
      }
      const up = clamp01(Math.min((6000 - left) / 700, left / 700));
      const x = baseX + S * 0.55 - (6000 - left) * S * 0.000035;
      const y = top + (H - top) * 0.42;
      const r = S * 0.016;
      // wake
      ctx.strokeStyle = withAlpha(col(dark ? C.sky : C.white), 0.55 * up);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + r * 2.6, y);
      ctx.lineTo(x + r * 9, y - r * 1.6);
      ctx.moveTo(x + r * 2.6, y + r * 0.3);
      ctx.lineTo(x + r * 9, y + r * 1.9);
      ctx.stroke();
      // snout, head ridge and scutes
      ctx.fillStyle = withAlpha(col(dark ? C.croc8 : C.croc6), up);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 3, r * 0.5 * up, 0, Math.PI, 0);
      for (let s = 0; s < 3; s++) {
        const sx = x + r * (3.4 + s * 1.2);
        ctx.moveTo(sx - r * 0.4, y);
        ctx.lineTo(sx, y - r * 0.5 * up);
        ctx.lineTo(sx + r * 0.4, y);
      }
      ctx.fill();
      const blink = (now / 1000) % 3 < 0.12 ? 0.15 : 1;
      ctx.fillStyle = withAlpha(col(C.gold3), up);
      ctx.beginPath();
      for (const dx of [r * 0.6, r * 1.6]) {
        ctx.moveTo(x + dx + r * 0.3, y - r * 0.55);
        ctx.ellipse(x + dx, y - r * 0.55, r * 0.3, r * 0.3 * blink * up, 0, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      shake *= Math.exp(-dt * 1.6);
      if (S <= 0) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const grownT = clamp01((now - born) / 2600);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(sky, 0, 0, W, H);
      layout(grownT);
      drawLeaves(true);
      drawTree();
      drawLeaves(false);
      drawCrownExtras();
      drawReeds();

      // fruit: hang, fall, float
      let dropped = false;
      ctx.strokeStyle = withAlpha(col(dark ? C.ink300 : C.ink800), 0.6);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [i, f] of state.entries()) {
        if (f.phase !== "hang") continue;
        const t = f.tip;
        const swing = still
          ? 0
          : Math.sin(time * 1.8 + i) * 0.15 + shake * Math.sin(time * 12 + i) * 0.5;
        f.x = (bx[t] ?? 0) + Math.sin(swing) * fruitR() * 1.5;
        f.y = (by[t] ?? 0) + Math.cos(swing) * fruitR() * 1.5;
        if ((shown[t] ?? 0) >= 1) {
          ctx.moveTo(bx[t] ?? 0, by[t] ?? 0);
          ctx.lineTo(f.x, f.y);
        }
      }
      ctx.stroke();
      for (const [i, f] of state.entries()) {
        if (f.phase === "hang") {
          f.grow = Math.min(1, f.grow + dt * 0.8);
          const ripe = (shown[f.tip] ?? 0) >= 1 ? f.grow : 0;
          drawFruit(f.x, f.y, i, ripe);
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
          drawFruit(f.x, f.y, i, 1);
          if (f.y >= top + (H - top) * 0.25) {
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

      drawWater();
      if (look.krathong) drawKrathong();
      for (const [i, f] of state.entries()) {
        if (f.phase !== "float") continue;
        f.x += (pondX(f.slot) - f.x) * Math.min(1, dt * 1.4);
        f.y += (floatY(i) - f.y) * Math.min(1, dt * 2);
        drawFruit(f.x, f.y + (still ? 0 : Math.sin(time * 2 + i) * 1.5), i, 0.9);
      }
      drawRipples(dt);
      drawCroc(now);
      spawn();
      drawMotes(dt);

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
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
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
  }, [tokens, look, key, dark, fruits, treeX]);

  return (
    <figure className={cn("relative mx-auto w-full", className)}>
      <div
        ref={wrapRef}
        className={cn("stree relative w-full touch-pan-y select-none", sceneClassName)}
      >
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
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </figcaption>
    </figure>
  );
}

// the same few colours at the same few alphas, every frame: build each string once
const RGBA = new Map<string, string>();
function withAlpha(hex: string, a: number) {
  const q = Math.round(clamp01(a) * 100);
  const k = `${hex}/${String(q)}`;
  let s = RGBA.get(k);
  if (!s) {
    const n = parseInt(hex.slice(1), 16) || 0;
    s = `rgba(${String((n >> 16) & 255)},${String((n >> 8) & 255)},${String(n & 255)},${String(q / 100)})`;
    RGBA.set(k, s);
  }
  return s;
}
