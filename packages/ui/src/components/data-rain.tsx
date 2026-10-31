"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";

/**
 * Data rain: thousands of falling light trails on a 2D canvas that part around the pointer like
 * water round a stone (potential flow round a cylinder, a wake behind it, Kármán vortex puffs
 * shed as it moves, Lamb–Oseen decay). Lines turn from calm to hot as they speed up; a few fire
 * like synapses. A quarter-resolution copy blurred by CSS gives the bloom. With no pointer an
 * autopilot drifts through. Adaptive quality drops the line count on slow devices.
 *
 * Vendored from 21st.dev ("data-rain"): CSS moved to styles.css (`.dr-*`), strict-lint fixes,
 * pauses off screen (IntersectionObserver), and a contained pane only reacts to a pointer over
 * it. Reduced motion: one pre-simulated still frame.
 */

export interface DataRainPalette {
  calm: string;
  mid: string;
  hot: string;
}

export interface DataRainProps {
  className?: string;
  count?: number;
  flowSpeed?: number;
  obstacleRadius?: number;
  autopilot?: boolean;
  /** Fixed behind the whole page (default) or contained in its parent. */
  fullscreen?: boolean;
  /** Hex colours; defaults to the --dr-* CSS variables, then built-in cyan / violet / pink. */
  palette?: DataRainPalette;
  /**
   * Only the rain, over a page: no backdrop, vignette or grain, never hit-tested. With a light
   * `tone` the lines are painted normally (they would vanish blended "lighter" on a pale page).
   */
  overlay?: boolean;
  tone?: "light" | "dark";
}

interface EngineApi {
  refresh: () => void;
}

type RGB = readonly [number, number, number];

const MAX = 7000; // particle capacity
const L = 19; // history points per particle
const STEP = 1 / 60; // fixed physics step
const PUFFS = 32; // vortex pool size
const TAU = Math.PI * 2;
const AGE_BUCKETS = 6;
const SEGS_PER_BUCKET = 3;

const DEFAULT_CALM: RGB = [34, 230, 255];
const DEFAULT_MID: RGB = [138, 92, 255];
const DEFAULT_HOT: RGB = [255, 61, 154];
const DEFAULT_CORE: RGB = [234, 252, 255];

const BASE_ALPHA = [0.2, 0.32, 0.48] as const;
const BASE_WIDTH = [0.7, 0.9, 1.2] as const;
const ALPHA_GAIN = 1.3;
const HEAD_WIDTH = 1.4;

// per-step filter coefficients (the step is fixed)
const K_RELAX = 1 - Math.exp(-STEP / 0.12);
const K_Q = 1 - Math.exp(-STEP * 8);
const K_CURSOR = 1 - Math.exp(-STEP * 18);
const K_VEL = 1 - Math.exp(-STEP * 10);
const K_IN = 1 - Math.exp(-STEP / 0.06);
const K_OUT = 1 - Math.exp(-STEP / 0.2);
const FIRE_P = 0.03 * STEP;
const FIRE_DECAY = Math.exp(-STEP / 0.45);
const PUFF_DECAY = Math.exp(-STEP / 1.1);

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHex(input: string | undefined, fallback: RGB): RGB {
  if (!input) return fallback;
  let s = input.trim().replace(/^#/, "");
  if (s.length === 3) {
    s = s.charAt(0) + s.charAt(0) + s.charAt(1) + s.charAt(1) + s.charAt(2) + s.charAt(2);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return fallback;
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Wave {
  kx: number;
  ky: number;
  om: number;
  ph: number;
  au: number; // velocity amplitude along x per unit cos()
  av: number; // velocity amplitude along y per unit cos()
}

/**
 * One term of the divergence-free sway field ψ = A/|k| · sin(k·x + ωt + φ):
 * u = ∂ψ/∂y = A·sinθ·cos(·), v = −∂ψ/∂x = −A·cosθ·cos(·) (analytic, |(u,v)| ≤ A).
 */
function makeWave(lambda: number, angle: number, omega: number, phase: number, amp: number): Wave {
  const k = TAU / lambda;
  return {
    kx: k * Math.cos(angle),
    ky: k * Math.sin(angle),
    om: omega,
    ph: phase,
    au: amp * Math.sin(angle),
    av: -amp * Math.cos(angle),
  };
}

const WAVE_0 = makeWave(380, 0.35, 0.18, 0.7, 16);
const WAVE_1 = makeWave(620, 1.9, 0.27, 2.1, 13);
const WAVE_2 = makeWave(900, 3.4, 0.35, 4.2, 10);

export function DataRain(props: DataRainProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLCanvasElement | null>(null);
  const bloomRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef<DataRainProps>(props);
  const apiRef = useRef<EngineApi | null>(null);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const root = rootRef.current;
    const main = mainRef.current;
    const bloom = bloomRef.current;
    if (!root || !main || !bloom) return undefined;
    const ctx = main.getContext("2d");
    const bctx = bloom.getContext("2d");
    if (!ctx || !bctx) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry32(7);
    const contained = !(propsRef.current.fullscreen ?? true);

    let disposed = false;
    let initialised = false;
    let live = false;
    let onScreen = true;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let bw = 1;
    let bh = 1;

    // particles (allocated once)
    const px = new Float32Array(MAX);
    const py = new Float32Array(MAX);
    const vx = new Float32Array(MAX);
    const vy = new Float32Array(MAX);
    const pz = new Float32Array(MAX);
    const v0 = new Float32Array(MAX);
    const qv = new Float32Array(MAX);
    const fire = new Float32Array(MAX);
    const len = new Uint8Array(MAX);
    const hx = new Float32Array(MAX * L);
    const hy = new Float32Array(MAX * L);
    let head = 0;

    // render groups
    const groupList: Int32Array[] = [];
    for (let g = 0; g < 6; g++) groupList.push(new Int32Array(MAX));
    const groupCount = new Int32Array(6);

    const strokeStyles = new Array<string>(6 * AGE_BUCKETS).fill("");
    const strokeWidths = new Float32Array(6 * AGE_BUCKETS);
    const headStyles = ["", ""];
    let haloGradient: CanvasGradient | null = null;

    // vortex pool
    const pX = new Float32Array(PUFFS);
    const pY = new Float32Array(PUFFS);
    const pGamma = new Float32Array(PUFFS);
    const pAge = new Float32Array(PUFFS);
    const pAlive = new Uint8Array(PUFFS);
    const aX = new Float32Array(PUFFS); // compact per-step views of live puffs
    const aY = new Float32Array(PUFFS);
    const aG = new Float32Array(PUFFS);
    const aC2 = new Float32Array(PUFFS);
    const aR2 = new Float32Array(PUFFS);
    let aCount = 0;
    let puffCursor = 0;
    let shedSign = 1;
    let shedAcc = 0;

    let simTime = 0;
    let liveTime = 0;
    let active = 0;
    let targetCount = 0;
    let quality = 1;

    // input / cursor
    let pointerActive = false;
    let pointerX = 0;
    let pointerY = 0;
    let idleSince = 0;
    let idleDelay = 1.2;
    let prevSrc = 0;
    let tgtX = 0;
    let tgtY = 0;
    let cx = 0;
    let cy = 0;
    let pcx = 0;
    let pcy = 0;
    let vcx = 0;
    let vcy = 0;
    let influence = 0;
    let curA = 64;

    // loop
    let raf = 0;
    let last = 0;
    let acc = 0;
    let frameEma = 16.7;
    let workEma = 4;
    let slowFrames = 0;
    let fastFrames = 0;

    const buildStyles = (): void => {
      const cs = getComputedStyle(root);
      const pal = propsRef.current.palette;
      const calm = parseHex(pal?.calm ?? cs.getPropertyValue("--dr-calm"), DEFAULT_CALM);
      const mid = parseHex(pal?.mid ?? cs.getPropertyValue("--dr-mid"), DEFAULT_MID);
      const hot = parseHex(pal?.hot ?? cs.getPropertyValue("--dr-hot"), DEFAULT_HOT);
      const core = parseHex(cs.getPropertyValue("--dr-core"), DEFAULT_CORE);
      const colours = [calm, mid, hot];

      for (let g = 0; g < 6; g++) {
        const depth = g < 3 ? 0 : 1;
        const bucket = g % 3;
        const c = colours[bucket] ?? calm;
        for (let ab = 0; ab < AGE_BUCKETS; ab++) {
          const falloff = Math.pow(1 - (ab + 0.5) / AGE_BUCKETS, 1.5);
          const alpha = Math.min(
            0.95,
            (BASE_ALPHA[bucket] ?? 0.2) * (depth === 0 ? 0.55 : 1) * falloff * ALPHA_GAIN,
          );
          strokeStyles[g * AGE_BUCKETS + ab] =
            `rgba(${String(c[0])},${String(c[1])},${String(c[2])},${alpha.toFixed(3)})`;
          const width =
            (BASE_WIDTH[bucket] ?? 0.7) *
            (depth === 0 ? 0.75 : 1) *
            (1 - (0.45 * ab) / AGE_BUCKETS);
          strokeWidths[g * AGE_BUCKETS + ab] = clamp(width, 0.6, 1.3);
        }
      }
      const rgb = (c: RGB) => `${String(c[0])},${String(c[1])},${String(c[2])}`;
      headStyles[0] = `rgba(${rgb(core)},0.5)`;
      headStyles[1] = `rgba(${rgb(core)},0.85)`;

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, `rgba(${rgb(hot)},1)`);
      grad.addColorStop(0.45, `rgba(${rgb(hot)},0.32)`);
      grad.addColorStop(1, `rgba(${rgb(hot)},0)`);
      haloGradient = grad;
    };

    const seedParticle = (i: number, uniform: boolean): void => {
      let x: number;
      let y: number;
      if (uniform) {
        x = rand() * w;
        y = rand() * h;
      } else {
        x = -40 + rand() * (w + 80);
        y = -40 - rand() * 80;
      }
      const z = 0.35 + 0.65 * rand();
      const nominal = 70 + 90 * z * z;
      const flow = clamp(propsRef.current.flowSpeed ?? 1, 0.05, 5);
      pz[i] = z;
      v0[i] = nominal;
      len[i] = 9 + Math.floor(rand() * 11);
      px[i] = x;
      py[i] = y;
      vx[i] = 0;
      vy[i] = nominal * flow;
      qv[i] = 1;
      fire[i] = 0;
      const base = i * L;
      for (let k = 0; k < L; k++) {
        hx[base + k] = x;
        hy[base + k] = y;
      }
    };

    const seedAll = (): void => {
      for (let i = 0; i < MAX; i++) seedParticle(i, true);
    };

    const setActive = (n: number, uniform: boolean): void => {
      const next = clamp(Math.round(n), 1, MAX);
      for (let i = active; i < next; i++) seedParticle(i, uniform);
      active = next;
    };

    const applyCount = (uniform: boolean): void => {
      const auto = clamp(Math.round((w * h) / 520), 1200, 5200);
      const requested = propsRef.current.count;
      targetCount = clamp(Math.round(requested ?? auto), 1, MAX);
      setActive(targetCount * quality, uniform);
    };

    const spawnPuff = (a: number, speed: number): void => {
      const dxn = vcx / speed;
      const dyn = vcy / speed;
      const sign = shedSign;
      shedSign = -shedSign;
      const j = puffCursor;
      puffCursor = (puffCursor + 1) % PUFFS;
      pX[j] = cx - dxn * 0.6 * a - dyn * sign * 0.7 * a;
      pY[j] = cy - dyn * 0.6 * a + dxn * sign * 0.7 * a;
      pGamma[j] = clamp(sign * Math.min(speed, 1200) * a * 1.5, -105000, 105000);
      pAge[j] = 0;
      pAlive[j] = 1;
    };

    const simulate = (): void => {
      const p = propsRef.current;
      const flow = clamp(p.flowSpeed ?? 1, 0.05, 5);
      const obsR = p.obstacleRadius ?? 64;
      const autopilotOn = p.autopilot ?? true;

      head = (head + 1) % L;
      simTime += STEP;
      if (live) liveTime += STEP;

      // cursor source: real pointer > ghost > none
      const ghostOn =
        !reduced && autopilotOn && !pointerActive && live && liveTime - idleSince >= idleDelay;
      const src = pointerActive ? 2 : ghostOn ? 1 : 0;
      if (src === 1) {
        tgtX = w * (0.5 + 0.32 * Math.sin(0.37 * liveTime));
        tgtY = h * (0.5 + 0.28 * Math.sin(0.53 * liveTime + 1.2));
      } else if (src === 2) {
        tgtX = pointerX;
        tgtY = pointerY;
      }
      const snap = src !== 0 && prevSrc === 0 && influence < 0.05;
      prevSrc = src;

      if (snap) {
        cx = tgtX;
        cy = tgtY;
        pcx = cx;
        pcy = cy;
        vcx = 0;
        vcy = 0;
      } else {
        pcx = cx;
        pcy = cy;
        cx += (tgtX - cx) * K_CURSOR;
        cy += (tgtY - cy) * K_CURSOR;
        vcx += ((cx - pcx) / STEP - vcx) * K_VEL;
        vcy += ((cy - pcy) / STEP - vcy) * K_VEL;
      }

      influence += ((src !== 0 ? 1 : 0) - influence) * (src !== 0 ? K_IN : K_OUT);
      const infl = influence;

      const vcMag = Math.sqrt(vcx * vcx + vcy * vcy);
      const a = obsR + Math.min(vcMag * 0.025, 36);
      curA = a;

      // shed Kármán puffs
      if (infl > 0.3 && vcMag > 60) {
        const dxm = cx - pcx;
        const dym = cy - pcy;
        shedAcc += Math.sqrt(dxm * dxm + dym * dym);
        let guard = 0;
        while (shedAcc >= 28 && guard < 4) {
          shedAcc -= 28;
          guard++;
          spawnPuff(a, vcMag);
        }
        if (shedAcc >= 28) shedAcc = 0;
      } else {
        shedAcc = 0;
      }

      // evolve puffs, build a compact live list
      aCount = 0;
      const puffDrift = 0.5 * 115 * flow * STEP;
      for (let j = 0; j < PUFFS; j++) {
        if (pAlive[j] === 0) continue;
        const age = (pAge[j] ?? 0) + STEP;
        if (age > 2.4) {
          pAlive[j] = 0;
          continue;
        }
        pAge[j] = age;
        const gamma = (pGamma[j] ?? 0) * PUFF_DECAY;
        pGamma[j] = gamma;
        pY[j] = (pY[j] ?? 0) + puffDrift;
        const c2 = 676 + 90 * age; // 26² + 90·age (viscous spreading)
        aX[aCount] = pX[j] ?? 0;
        aY[aCount] = pY[j] ?? 0;
        aG[aCount] = gamma / TAU;
        aC2[aCount] = c2;
        aR2[aCount] = 36 * c2;
        aCount++;
      }

      const ph0 = WAVE_0.om * simTime + WAVE_0.ph;
      const ph1 = WAVE_1.om * simTime + WAVE_1.ph;
      const ph2 = WAVE_2.om * simTime + WAVE_2.ph;

      const obsOn = infl > 0.002;
      const projectOn = infl > 0.05;
      const projScale = Math.min(1, infl * 1.5);
      const respawnBottom = h + 40;
      const respawnRight = w + 120;

      for (let i = 0; i < active; i++) {
        const x0 = px[i] ?? 0;
        const y0 = py[i] ?? 0;
        const z = pz[i] ?? 1;
        const v0e = (v0[i] ?? 100) * flow;

        // base fall + divergence-free sway
        const c0 = Math.cos(WAVE_0.kx * x0 + WAVE_0.ky * y0 + ph0);
        const c1 = Math.cos(WAVE_1.kx * x0 + WAVE_1.ky * y0 + ph1);
        const c2 = Math.cos(WAVE_2.kx * x0 + WAVE_2.ky * y0 + ph2);
        let tx = (WAVE_0.au * c0 + WAVE_1.au * c1 + WAVE_2.au * c2) * z;
        let ty = v0e + (WAVE_0.av * c0 + WAVE_1.av * c1 + WAVE_2.av * c2) * z;

        const zf = 0.55 + 0.45 * z; // far lines are influenced less
        const aE = a * zf;
        const rx = x0 - cx;
        const ry = y0 - cy;

        let pertX = 0;
        let pertY = 0;
        let deficit = 0;

        if (obsOn) {
          const d2 = rx * rx + ry * ry;
          let Ux = -vcx;
          let Uy = v0e - vcy;
          let U = Math.sqrt(Ux * Ux + Uy * Uy);
          if (U > 1e-3) {
            if (U > 900) {
              const sc = 900 / U;
              Ux *= sc;
              Uy *= sc;
              U = 900;
            }
            const ex = Ux / U;
            const ey = Uy / U;
            const s = rx * ex + ry * ey; // along the relative flow (+ = downstream)
            const n = -rx * ey + ry * ex; // across it

            // static wake deficit
            if (s > 0 && s < 12 * aE) {
              const wd = 0.9 * aE + 0.2 * s;
              const nn = n / wd;
              deficit = 0.55 * Math.exp(-s / (3 * aE)) * Math.exp(-nn * nn);
            }

            // potential flow round a cylinder, perturbation part only
            const near = 9 * aE;
            if (d2 < near * near) {
              const rho2 = Math.max(s * s + n * n, aE * aE * 0.64);
              const k = (aE * aE) / (rho2 * rho2);
              const ds = -U * k * (s * s - n * n);
              const dn = -U * k * 2 * s * n;
              let win = 1;
              const inner = 5 * aE;
              if (d2 > inner * inner) {
                const t = (Math.sqrt(d2) - inner) / (4 * aE);
                win = 1 - t * t * (3 - 2 * t);
              }
              pertX = (ds * ex - dn * ey) * win;
              pertY = (ds * ey + dn * ex) * win;
            }
          }
        }

        // Lamb–Oseen vortex puffs (they decay on their own, so not scaled by influence)
        let vorX = 0;
        let vorY = 0;
        for (let j = 0; j < aCount; j++) {
          const dx = x0 - (aX[j] ?? 0);
          const dy = y0 - (aY[j] ?? 0);
          const d2p = dx * dx + dy * dy + 1e-3;
          const r2 = aR2[j] ?? 0;
          if (d2p < r2) {
            const f = ((aG[j] ?? 0) * (1 - Math.exp(-d2p / (aC2[j] ?? 1)))) / d2p;
            const wnd = 1 - d2p / r2;
            const fw = f * wnd * wnd * zf;
            vorX += -dy * fw;
            vorY += dx * fw;
          }
        }

        const keep = 1 - deficit * infl;
        tx = tx * keep + pertX * infl + vorX;
        ty = ty * keep + pertY * infl + vorY;

        // inertia
        const vxi = vx[i] ?? 0;
        const vyi = vy[i] ?? 0;
        let ux = vxi + (tx - vxi) * K_RELAX;
        let uy = vyi + (ty - vyi) * K_RELAX;
        const sp2 = ux * ux + uy * uy;
        if (sp2 > 810000) {
          const sc = 900 / Math.sqrt(sp2);
          ux *= sc;
          uy *= sc;
        }
        let x = x0 + ux * STEP;
        let y = y0 + uy * STEP;

        // never enter the disc
        if (projectOn) {
          const aP = aE * projScale;
          const qx = x - cx;
          const qy = y - cy;
          const q2 = qx * qx + qy * qy;
          const lim = 0.98 * aP;
          if (q2 < lim * lim) {
            const rr = Math.sqrt(q2);
            const nx = rr < 1e-3 ? 0 : qx / rr;
            const ny = rr < 1e-3 ? 1 : qy / rr;
            x = cx + nx * aP;
            y = cy + ny * aP;
            const vn = (ux - vcx) * nx + (uy - vcy) * ny;
            if (vn < 0) {
              ux -= vn * nx;
              uy -= vn * ny;
            }
          }
        }

        vx[i] = ux;
        vy[i] = uy;
        px[i] = x;
        py[i] = y;

        // respawn (full history reset, so no streaks across the screen)
        if (y > respawnBottom || x < -120 || x > respawnRight || y < -600) {
          seedParticle(i, false);
          continue;
        }

        // smoothed speed ratio drives the hue
        const q = qv[i] ?? 1;
        qv[i] = q + (Math.sqrt(ux * ux + uy * uy) / v0e - q) * K_Q;

        // synaptic firing
        if (rand() < FIRE_P) {
          fire[i] = 1;
        } else {
          const f = (fire[i] ?? 0) * FIRE_DECAY;
          fire[i] = f < 0.01 ? 0 : f;
        }

        const slot = i * L + head;
        hx[slot] = x;
        hy[slot] = y;
      }
    };

    const render = (): void => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // glowing light on dark; plain ink on a pale page
      const pr = propsRef.current;
      ctx.globalCompositeOperation = pr.overlay && pr.tone === "light" ? "source-over" : "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // subtle cursor halo (one gradient, scaled by the transform)
      if (influence > 0.02 && haloGradient) {
        const speed = Math.sqrt(vcx * vcx + vcy * vcy);
        const r = 1.5 * curA;
        ctx.globalAlpha = Math.min(1, (0.05 + Math.min(speed / 4000, 0.07)) * influence);
        ctx.setTransform(dpr * r, 0, 0, dpr * r, dpr * cx, dpr * cy);
        ctx.fillStyle = haloGradient;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // classify
      groupCount.fill(0);
      for (let i = 0; i < active; i++) {
        const qq = qv[i] ?? 1;
        let b = qq < 1.25 ? 0 : qq < 1.85 ? 1 : 2;
        if ((fire[i] ?? 0) > 0.35 && b < 2) b++;
        const g = ((pz[i] ?? 1) < 0.62 ? 0 : 3) + b;
        const list = groupList[g];
        if (!list) continue;
        const n = groupCount[g] ?? 0;
        list[n] = i;
        groupCount[g] = n + 1;
      }

      // trails: group × age bucket, one stroke each
      for (let g = 0; g < 6; g++) {
        const cnt = groupCount[g] ?? 0;
        const list = groupList[g];
        if (cnt === 0 || !list) continue;
        for (let ab = 0; ab < AGE_BUCKETS; ab++) {
          const k0 = ab * SEGS_PER_BUCKET;
          const k1 = k0 + SEGS_PER_BUCKET;
          ctx.strokeStyle = strokeStyles[g * AGE_BUCKETS + ab] ?? "";
          ctx.lineWidth = strokeWidths[g * AGE_BUCKETS + ab] ?? 1;
          ctx.beginPath();
          for (let j = 0; j < cnt; j++) {
            const i = list[j] ?? 0;
            const segs = (len[i] ?? 1) - 1;
            if (k0 >= segs) continue;
            const base = i * L;
            const kEnd = Math.min(k1, segs);
            let idx = (head - k0 + L) % L;
            ctx.moveTo(hx[base + idx] ?? 0, hy[base + idx] ?? 0);
            for (let k = k0; k < kEnd; k++) {
              idx = idx === 0 ? L - 1 : idx - 1;
              ctx.lineTo(hx[base + idx] ?? 0, hy[base + idx] ?? 0);
            }
          }
          ctx.stroke();
        }
      }

      // white-hot head sparks: the fastest lines and the firing ones
      const prevHead = head === 0 ? L - 1 : head - 1;
      ctx.lineWidth = HEAD_WIDTH;
      for (let depth = 0; depth < 2; depth++) {
        ctx.strokeStyle = headStyles[depth] ?? "";
        ctx.beginPath();
        for (let b = 1; b < 3; b++) {
          const g = depth * 3 + b;
          const cnt = groupCount[g] ?? 0;
          const list = groupList[g];
          if (!list) continue;
          for (let j = 0; j < cnt; j++) {
            const i = list[j] ?? 0;
            if (b === 1 && (fire[i] ?? 0) <= 0.5) continue;
            const base = i * L;
            ctx.moveTo(hx[base + head] ?? 0, hy[base + head] ?? 0);
            ctx.lineTo(hx[base + prevHead] ?? 0, hy[base + prevHead] ?? 0);
          }
        }
        ctx.stroke();
      }

      // bloom: a quarter-resolution copy, blurred by CSS
      bctx.clearRect(0, 0, bw, bh);
      bctx.drawImage(main, 0, 0, bw, bh);
    };

    const presim = (seconds: number): void => {
      const n = Math.round(seconds / STEP);
      for (let s = 0; s < n; s++) simulate();
    };

    const rebuildStatic = (): void => {
      // reduced motion: a parked cursor, a pre-simulated field, one frame
      seedAll();
      active = 0;
      applyCount(true);
      pointerActive = true;
      pointerX = w * 0.4;
      pointerY = h * 0.45;
      tgtX = pointerX;
      tgtY = pointerY;
      cx = pcx = pointerX;
      cy = pcy = pointerY;
      vcx = 0;
      vcy = 0;
      influence = 1;
      prevSrc = 2;
      aCount = 0;
      pAlive.fill(0);
      presim(3);
      render();
    };

    const resize = (): void => {
      const rect = root.getBoundingClientRect();
      const nw = Math.max(1, rect.width || window.innerWidth);
      const nh = Math.max(1, rect.height || window.innerHeight);
      let d = Math.min(window.devicePixelRatio || 1, 2);
      if (nw * nh * d * d > 4.5e6) d = Math.sqrt(4.5e6 / (nw * nh));
      if (nw === w && nh === h && d === dpr) return;

      w = nw;
      h = nh;
      dpr = d;
      main.width = Math.max(1, Math.round(w * dpr));
      main.height = Math.max(1, Math.round(h * dpr));
      bw = Math.max(1, Math.ceil(w / 4));
      bh = Math.max(1, Math.ceil(h / 4));
      bloom.width = bw;
      bloom.height = bh;
      bctx.imageSmoothingEnabled = true;
      bctx.imageSmoothingQuality = "medium";

      if (!initialised) return;
      if (reduced) {
        rebuildStatic();
        return;
      }
      // keep the field; only recycle lines that are now out of bounds
      for (let i = 0; i < active; i++) {
        const x = px[i] ?? 0;
        if (x < -120 || x > w + 120 || (py[i] ?? 0) > h + 40) seedParticle(i, false);
      }
      applyCount(true);
      render();
    };

    const onLeave = (): void => {
      if (!pointerActive) return;
      pointerActive = false;
      idleSince = liveTime;
      idleDelay = 4;
    };
    const onMove = (e: PointerEvent): void => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // a contained pane only parts for a pointer that is over it
      if (contained && (x < 0 || y < 0 || x > r.width || y > r.height)) {
        onLeave();
        return;
      }
      pointerX = x;
      pointerY = y;
      pointerActive = true;
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerType !== "mouse") onLeave();
    };

    const frame = (now: number): void => {
      if (disposed) return;
      const dtRaw = Math.max(0, now - last);
      last = now;
      acc += Math.min(0.05, dtRaw / 1000);

      const t0 = performance.now();
      let n = 0;
      while (acc >= STEP && n < 3) {
        simulate();
        acc -= STEP;
        n++;
      }
      if (n === 3) acc = 0;
      if (n > 0) render();
      const work = performance.now() - t0;

      // adaptive quality (dpr never changes at runtime)
      if (dtRaw > 0 && dtRaw < 100) {
        frameEma += (dtRaw - frameEma) * 0.05;
        workEma += (work - workEma) * 0.05;
      }
      if (frameEma > 20) {
        slowFrames++;
        fastFrames = 0;
      } else if (frameEma < 18.5 && workEma < 12) {
        fastFrames++;
        slowFrames = 0;
      } else {
        slowFrames = 0;
        fastFrames = 0;
      }
      if (slowFrames >= 60 && quality > 0.4) {
        quality = Math.max(0.4, quality - 0.1);
        slowFrames = 0;
        applyCount(false);
      } else if (fastFrames >= 180 && quality < 1) {
        quality = Math.min(1, quality + 0.05);
        fastFrames = 0;
        applyCount(false);
      }

      raf = requestAnimationFrame(frame);
    };

    const start = (): void => {
      cancelAnimationFrame(raf);
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = (): void => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // runs only while the page is shown and the rain is on screen
    const sync = (): void => {
      if (live && !disposed && !document.hidden && onScreen) {
        if (!raf) start();
      } else stop();
    };

    resize();
    buildStyles();
    seedAll();
    applyCount(true);
    cx = pcx = tgtX = w * 0.5;
    cy = pcy = tgtY = h * 0.5;

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      sync();
    });
    io.observe(root);

    apiRef.current = {
      refresh: () => {
        if (disposed || !initialised) return;
        buildStyles();
        if (reduced) rebuildStatic();
        else applyCount(false);
      },
    };

    if (reduced) {
      initialised = true;
      rebuildStatic();
    } else {
      presim(2.5);
      render();
      initialised = true;
      live = true;
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onLeave, { passive: true });
      window.addEventListener("blur", onLeave);
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", sync);
      sync();
    }

    return () => {
      disposed = true;
      live = false;
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", sync);
      ro.disconnect();
      io.disconnect();
      apiRef.current = null;
      haloGradient = null;
    };
  }, []);

  const palette = props.palette;
  useEffect(() => {
    apiRef.current?.refresh();
  }, [props.count, palette?.calm, palette?.mid, palette?.hot]);

  const fullscreen = props.fullscreen ?? true;
  return (
    <div
      ref={rootRef}
      className={cn(
        "dr-root",
        !fullscreen && "dr-root--contained",
        props.overlay && "dr-root--overlay",
        props.className,
      )}
      data-tone={props.tone ?? "dark"}
      aria-hidden="true"
    >
      <canvas ref={bloomRef} className="dr-bloom" />
      <canvas ref={mainRef} className="dr-main" />
      <div className="dr-vignette" />
      <div className="dr-grain" />
    </div>
  );
}
