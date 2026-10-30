"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";

/**
 * Particle title: a line that dissolves into dust drifting in a soft glow, then gathers back into
 * crisp text. Six dissolve styles take turns (smoke, vortex, sand, burst, sweep, absorb). The real
 * heading stays in the DOM for screen readers; the canvas only draws. Pauses off screen and in a
 * hidden tab; reduced motion shows the plain heading.
 *
 * After "Particle Title" (21st.dev): colours from our tokens (ink = --foreground, page =
 * --background, glow = the palette tokens passed in), the page's own heading face and weight,
 * a larger, fluid size, strict-lint fixes.
 */

type RGB = [number, number, number];
type Box = { x: number; y: number; w: number; h: number };
type Field = { cx: number; cy: number; rx: number; ry: number };
type Mode = "smoke" | "vortex" | "sand" | "burst" | "sweep" | "absorb";
type Blob = { rgb: RGB; a: number; fx: number; fy: number; fw: number; fh: number };
type Palette = { ink: RGB; page: RGB; blobs: Blob[] };

const MODES: Mode[] = ["smoke", "vortex", "sand", "burst", "sweep", "absorb"];
const TIMING = { hold: 5200, field: 1400, travel: 4200 };
// where the three glow blobs sit, as shares of the box (same for the CSS backdrop and the maths)
const BLOBS = [
  { a: 0.55, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78, css: "left-[4%] top-[8%] w-[62%] h-[78%]" },
  { a: 0.5, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7, css: "left-[44%] top-[22%] w-[54%] h-[70%]" },
  { a: 0.42, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56, css: "left-[30%] top-[44%] w-[44%] h-[56%]" },
] as const;

const hexRgb = (hex: string): RGB => {
  const v = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
const ease = (t: number) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** A shuffled bag of modes, never the same one twice in a row. */
function createModeBag(seed: number): () => Mode {
  const r = createRng(seed);
  let bag: Mode[] = [];
  let last: Mode | null = null;
  return () => {
    if (!bag.length) {
      bag = MODES.slice().sort(() => r() - 0.5);
      if (bag.at(-1) === last) bag.reverse();
    }
    last = bag.pop() ?? "smoke";
    return last;
  };
}

function glowAt(pal: Palette, A: Box, x: number, y: number): { c: RGB; s: number } {
  let [r, g, b] = pal.page;
  let vis = 0;
  const rr = Math.hypot((x - (A.x + A.w / 2)) / (A.w / 2), (y - (A.y + A.h / 2)) / (A.h / 2));
  const rim = rr < 0.55 ? 1 : rr >= 1 ? 0 : 1 - (rr - 0.55) / 0.45;
  for (const bl of pal.blobs) {
    const bw = bl.fw * A.w;
    const bh = bl.fh * A.h;
    const cx = A.x + bl.fx * A.w + bw / 2;
    const cy = A.y + bl.fy * A.h + bh / 2;
    const s = Math.max(0, 1 - Math.hypot((x - cx) / (bw / 2), (y - cy) / (bh / 2))) * bl.a * rim;
    r = mix(r, bl.rgb[0], s);
    g = mix(g, bl.rgb[1], s);
    b = mix(b, bl.rgb[2], s);
    vis = Math.max(vis, s);
  }
  return { c: [r, g, b], s: vis };
}

/** A spot in the glow field, the brightest of four tries, so the dust settles in the light. */
function sampleFieldPoint(pal: Palette, rand: () => number, f: Field, A: Box) {
  let best = { x: f.cx, y: f.cy, c: pal.page, s: -1 };
  for (let k = 0; k < 4; k++) {
    const a = rand() * 6.2832;
    const q = Math.pow(rand(), 0.6);
    const x = f.cx + Math.cos(a) * f.rx * q;
    const y = f.cy + Math.sin(a) * f.ry * q;
    const g = glowAt(pal, A, x, y);
    if (g.s > best.s) best = { x, y, c: g.c, s: g.s };
  }
  return best;
}

type Cell = {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  hx: number;
  hy: number;
  nx: number;
  ny: number;
  r1: number;
  r2: number;
  r3: number;
  size: number;
  fx: number;
  fy: number;
  fc: RGB;
  lt: number;
  bend: number;
  pa: number;
};
type Phase = "text" | "dissolving" | "field" | "gathering";

function plan(mode: Mode, p: Cell, W: number, H: number) {
  switch (mode) {
    case "smoke":
      return { delay: (1 - clamp(p.ny)) * 0.35 + p.r3 * 0.25, bend: (p.r1 - 0.5) * 150 };
    case "vortex":
      return {
        delay: (Math.hypot(p.hx - W / 2, p.hy - H / 2) / Math.max(1, W)) * 0.9 + p.r3 * 0.15,
        bend: (p.r2 > 0.5 ? 1 : -1) * (90 + p.r1 * 140),
      };
    case "sand":
      return { delay: p.nx * 0.6 + p.r3 * 0.18, bend: (p.r1 - 0.5) * 60 };
    case "burst":
      return { delay: p.r3 * 0.1, bend: (p.r2 - 0.5) * 26 };
    case "sweep":
      return { delay: (1 - p.nx) * 0.6 + p.r3 * 0.18, bend: -(60 + p.r1 * 90) };
    case "absorb":
      return { delay: p.r1 * 0.55, bend: (p.r2 - 0.5) * 100 };
  }
}

function bowAt(a: [number, number], b: [number, number], bend: number, t: number) {
  const e = ease(t);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(e * Math.PI) * bend;
  return [mix(a[0], b[0], e) + (-dy / L) * bow, mix(a[1], b[1], e) + (dx / L) * bow, e] as const;
}

const rgbStr = (a: RGB, b: RGB, t: number) => {
  const c = (i: 0 | 1 | 2) => String(Math.max(0, Math.min(255, Math.round(mix(a[i], b[i], t)))));
  return `rgb(${c(0)},${c(1)},${c(2)})`;
};

type Engine = { setActive: (on: boolean) => void; resize: () => void; destroy: () => void };

const INTRO_LEAD = 0.08;

function createEngine(
  cv: HTMLCanvasElement,
  text: string,
  pal: Palette,
  font: { family: string; weight: string },
): Engine | null {
  const textCv = document.createElement("canvas");
  const ctx0 = cv.getContext("2d");
  const o0 = textCv.getContext("2d", { willReadFrequently: true });
  if (!ctx0 || !o0) return null;
  // typed copies: closures below don't keep the null check's narrowing
  const ctx: CanvasRenderingContext2D = ctx0;
  const o: CanvasRenderingContext2D = o0;
  const nextMode = createModeBag((Date.now() & 0xffff) ^ 0x5a5a);
  let W = 0;
  let H = 0;
  let dpr = 1;
  let field: Field = { cx: 0, cy: 0, rx: 0, ry: 0 };
  let box: Box = { x: 0, y: 0, w: 0, h: 0 };
  let parts: Cell[] = [];
  let phase: Phase = "gathering";
  let mode: Mode = nextMode();
  let phaseStart = 0;
  let raf = 0;
  let timer = 0;
  let intro = true;
  let active = true;
  let destroyed = false;

  function reroll() {
    const r = createRng((Math.random() * 1e9) | 0);
    for (const p of parts) {
      const q = sampleFieldPoint(pal, r, field, box);
      p.fx = q.x;
      p.fy = q.y;
      p.fc = q.c;
    }
  }

  function build() {
    W = cv.clientWidth;
    H = cv.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    textCv.width = cv.width;
    textCv.height = cv.height;
    // fluid: 26px on phones up to 60px on wide screens
    const fs = Math.max(26, Math.min(60, W * 0.065));
    const ty = H / 2;
    box = { x: 0, y: 0, w: W, h: H };
    field = { cx: W / 2, cy: H / 2, rx: Math.min(560, W * 0.4), ry: Math.min(260, H * 0.3) };
    o.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.clearRect(0, 0, W, H);
    o.font = `${font.weight} ${String(fs)}px ${font.family}`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    const m = o.measureText(text);
    const tx = W / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
    o.fillStyle = `rgba(${pal.ink.join(",")},.95)`;
    o.fillText(text, tx, ty);
    const tw = m.width;
    const X0 = Math.max(0, Math.floor((tx - tw / 2 - 6) * dpr));
    const X1 = Math.min(cv.width, Math.ceil((tx + tw / 2 + 6) * dpr));
    // Thai marks stand above and below the line: give the scan room for them
    const Y0 = Math.max(0, Math.floor((ty - fs * 1.2) * dpr));
    const Y1 = Math.min(cv.height, Math.ceil((ty + fs * 1.2) * dpr));
    const d = o.getImageData(0, 0, cv.width, cv.height).data;
    let cs = Math.max(2, Math.round(3 * dpr));
    let pts: { x: number; y: number; w: number; h: number }[];
    for (;;) {
      pts = [];
      for (let y = Y0; y < Y1; y += cs) {
        for (let x = X0; x < X1; x += cs) {
          const w = Math.min(cs, cv.width - x);
          const h = Math.min(cs, cv.height - y);
          let hit = false;
          for (let yy = y; yy < y + h && !hit; yy++) {
            for (let xx = x; xx < x + w; xx++) {
              if ((d[(yy * cv.width + xx) * 4 + 3] ?? 0) > 0) {
                hit = true;
                break;
              }
            }
          }
          if (hit) pts.push({ x, y, w, h });
        }
      }
      if (pts.length <= 2600) break;
      cs++;
    }
    let minX = 1e9;
    let maxX = -1e9;
    for (const p of pts) {
      const cx = (p.x + p.w / 2) / dpr;
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
    }
    const r = createRng(7);
    parts = pts.map((p) => {
      const u = r();
      const size = u < 0.62 ? 0.9 + r() * 0.8 : u < 0.9 ? 1.8 + r() * 1.4 : 3.4 + r() * 3.2;
      const hx = (p.x + p.w / 2) / dpr;
      const hy = (p.y + p.h / 2) / dpr;
      return {
        rx: p.x,
        ry: p.y,
        rw: p.w,
        rh: p.h,
        hx,
        hy,
        nx: (hx - minX) / Math.max(1, maxX - minX),
        ny: (hy - (ty - fs / 2)) / fs,
        r1: r(),
        r2: r(),
        r3: r(),
        size,
        fx: 0,
        fy: 0,
        fc: [0, 0, 0],
        lt: 0,
        bend: 0,
        pa: 0,
      };
    });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    reroll();
  }

  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
  }

  function drawRealText() {
    clear();
    ctx.globalAlpha = 1;
    ctx.drawImage(textCv, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now: number) {
    raf = 0;
    const lead = intro && phase === "gathering" ? INTRO_LEAD : 0;
    const prog = clamp((now - phaseStart) / TIMING.travel + lead);
    const out = phase === "dissolving";
    clear();
    // the parts of the real text that are not in flight
    for (const p of parts) {
      const pl = plan(mode, p, W, H);
      const lt = clamp((prog - pl.delay * 0.55) / 0.45);
      p.lt = lt;
      p.bend = pl.bend;
      p.pa = out ? 1 - smooth(lt / 0.18) : smooth((lt - 0.82) / 0.18);
      if (p.pa <= 0.002) continue;
      ctx.globalAlpha = p.pa;
      ctx.drawImage(textCv, p.rx, p.ry, p.rw, p.rh, p.rx, p.ry, p.rw, p.rh);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the dust in flight, taking the glow's colour as it leaves the text
    for (const p of parts) {
      const lt = p.lt;
      if (lt <= 0 || lt >= 1) continue;
      const a: [number, number] = out ? [p.hx, p.hy] : [p.fx, p.fy];
      const b: [number, number] = out ? [p.fx, p.fy] : [p.hx, p.hy];
      const q = bowAt(a, b, out ? p.bend : -p.bend, lt);
      const e = out ? q[2] : 1 - q[2];
      let alpha = 0.1 + 0.9 * (1 - smooth((e - 0.45) / 0.55));
      alpha *= out ? 1 - smooth((lt - 0.85) / 0.15) : smooth(lt / 0.15) * (1 - p.pa);
      if (alpha <= 0.004) continue;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = rgbStr(pal.ink, p.fc, smooth(e / 0.6));
      ctx.beginPath();
      ctx.arc(q[0], q[1], (p.size * mix(1, 1.7, smooth(e))) / 2, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (prog < 1) raf = requestAnimationFrame(frame);
    else advance();
  }

  function stopWork() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function enter(next: Phase) {
    phase = next;
    phaseStart = performance.now();
    stopWork();
    if (!active || destroyed) return;
    if (next === "text") {
      intro = false;
      drawRealText();
      timer = window.setTimeout(advance, TIMING.hold);
    } else if (next === "field") {
      clear();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      timer = window.setTimeout(advance, TIMING.field);
    } else {
      if (next === "dissolving") {
        mode = nextMode();
        reroll();
      }
      frame(performance.now());
    }
  }

  function advance() {
    enter(
      phase === "text"
        ? "dissolving"
        : phase === "dissolving"
          ? "field"
          : phase === "field"
            ? "gathering"
            : "text",
    );
  }

  build();
  enter("gathering");
  return {
    setActive(on) {
      if (on === active || destroyed) return;
      active = on;
      if (on) enter(phase);
      else stopWork();
    },
    resize() {
      if (destroyed) return;
      stopWork();
      build();
      if (active) enter(phase);
      else if (phase === "text") drawRealText();
    },
    destroy() {
      destroyed = true;
      active = false;
      stopWork();
    },
  };
}

export interface ParticleTitleProps {
  /** The line. The real heading stays in the DOM for screen readers. */
  text: string;
  /** Three palette tokens for the glow, e.g. ["--em-blue-500", "--em-violet-500", "--em-sky-500"]. */
  glow?: readonly [string, string, string];
  className?: string;
}

export function ParticleTitle({
  text,
  glow = ["--em-blue-500", "--em-violet-500", "--em-sky-500"],
  className,
}: ParticleTitleProps) {
  const [reduce, setReduce] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const colors = useTokenColors(["--foreground", "--background", ...glow]);
  const wanted = colors?.join() ?? "";
  // the colours the dust is built with: a rebuild resamples the whole title, so off screen it
  // waits until the title scrolls into view (not mid theme switch, where it stalls the page)
  const [key, setKey] = useState("");
  useEffect(() => {
    const heading = headingRef.current;
    if (wanted === key || !heading) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setKey(wanted);
    });
    io.observe(heading);
    return () => {
      io.disconnect();
    };
  }, [wanted, key]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => {
      setReduce(mq.matches);
    };
    on();
    mq.addEventListener("change", on);
    return () => {
      mq.removeEventListener("change", on);
    };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    const heading = headingRef.current;
    if (reduce || !cv || !heading || !key) return;
    const [ink = "#000000", page = "#ffffff", ...glows] = key.split(",");
    const dark = (hexRgb(page)[0] + hexRgb(page)[1] + hexRgb(page)[2]) / 3 < 128;
    const pal: Palette = {
      ink: hexRgb(ink),
      page: hexRgb(page),
      blobs: BLOBS.map((b, i) => ({
        ...b,
        a: b.a * (dark ? 0.75 : 1),
        rgb: hexRgb(glows[i] ?? ink),
      })),
    };
    const cs = getComputedStyle(heading);
    const engine = createEngine(cv, text, pal, { family: cs.fontFamily, weight: cs.fontWeight });
    if (!engine) return;
    let visible = true;
    let size = `${String(cv.clientWidth)}x${String(cv.clientHeight)}`;
    const sync = () => {
      engine.setActive(visible && !document.hidden);
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries.at(-1)?.isIntersecting ?? false;
      sync();
    });
    io.observe(cv);
    let rz = 0;
    const ro = new ResizeObserver(() => {
      const next = `${String(cv.clientWidth)}x${String(cv.clientHeight)}`;
      if (next === size) return;
      size = next;
      clearTimeout(rz);
      rz = window.setTimeout(() => {
        engine.resize();
      }, 200);
    });
    ro.observe(cv);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      document.removeEventListener("visibilitychange", sync);
      clearTimeout(rz);
      io.disconnect();
      ro.disconnect();
      engine.destroy();
    };
  }, [reduce, key, text]);

  return (
    <div
      className={cn(
        "relative isolate flex h-[300px] w-full items-center justify-center overflow-hidden sm:h-[360px]",
        className,
      )}
    >
      {/* the soft glow the dust drifts in */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      >
        {BLOBS.map((b, i) => (
          <div
            key={b.css}
            className={cn("absolute rounded-full", b.css)}
            style={{
              background: `radial-gradient(closest-side, color-mix(in oklab, var(${glow[i] ?? "--em-blue-500"}) ${String(Math.round(b.a * 45))}%, transparent), transparent 100%)`,
            }}
          />
        ))}
      </div>

      {!reduce && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}

      {/* the real heading: read by screen readers, and the source of the canvas font */}
      <h2
        ref={headingRef}
        className={cn(
          "m-0 px-6 text-center text-3xl font-black tracking-tight text-foreground sm:text-5xl",
          reduce ? "relative z-10" : "sr-only",
        )}
      >
        {text}
      </h2>
    </div>
  );
}
