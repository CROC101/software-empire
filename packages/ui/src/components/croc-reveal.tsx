"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Croc reveal: a poster that rips in two as you scroll. A tagline over one huge word; scroll and
 * a crack runs out from the middle of the word, the sheet tears along it, the halves pull apart
 * (top lifting, bottom dropping, each tipping like paper) and a crocodile surfaces in the gap,
 * eyes just above the water, then opens them. Once it is looking the slit pupils follow the
 * pointer and blink; click and they narrow. Scroll back up and the paper closes.
 *
 * Adapted from "Tiger Tear Reveal" (21st.dev): the tear is the original, the animal is ours.
 * All SVG from numbers, colours from palette tokens (--em-croc-*, --em-gold-*, --em-blue-*),
 * so it follows the shared theme. The frame loop runs only while the section is on screen.
 */

type Pt = [number, number];

// #region tear (from the original)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);

function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Overshoot ease: the eyes open a little too wide, then settle. */
export function easeOutBack(t: number) {
  const c = 1.70158;
  const u = clamp01(t) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

/** How far through the pinned scroll we are: 0 at the top, 1 when the stage lets go. */
export function scrollProgress(top: number, height: number, viewport: number) {
  const range = height - viewport;
  if (range <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / range);
}

/** One scroll value drives five beats. */
export function stages(p: number) {
  return {
    crack: smooth(0.03, 0.2, p), // a crack runs out from the middle of the word
    open: smooth(0.18, 0.62, p), // the sheet tears and the halves pull apart
    rise: smooth(0.26, 0.74, p), // the croc surfaces
    pop: smooth(0.58, 0.88, p), // and opens its eyes
    shake: smooth(0.16, 0.22, p) * (1 - smooth(0.26, 0.36, p)), // the jolt of the rip
  };
}

/** The tear, left to right: a slight rising diagonal, a slow wander, fibres, the odd tooth. */
function tearLine(
  seed = 11,
  from = -800,
  to = 1800,
  step = 9,
  cx = 500,
  cy = 318,
  angle = -7,
): Pt[] {
  const r = rng(seed);
  const slope = Math.tan((angle * Math.PI) / 180);
  const out: Pt[] = [];
  for (let x = from; x <= to; x += step) {
    const fibre = (r() - 0.5) * 5;
    const tooth = r() < 0.09 ? (r() - 0.5) * 26 : 0;
    const wander = Math.sin(x * 0.019 + seed) * 10 + Math.sin(x * 0.053 + seed * 2) * 4;
    out.push([x, cy + (x - cx) * slope + wander + fibre + tooth]);
  }
  return out;
}

function pieceMotion(open: number) {
  return {
    top: { dx: -10 * open, dy: -82 * open, rot: -2.6 * open },
    bottom: { dx: 12 * open, dy: 78 * open, rot: 2.1 * open },
  };
}

/** Width of the white paper core exposed along a torn edge. */
function fibreWidths(n: number, open: number, seed: number) {
  const r = rng(seed);
  const k = Math.min(1, open * 4);
  return Array.from(
    { length: n },
    (_, i) => k * (2.5 + 6 * (0.5 + 0.5 * Math.sin(i * 0.37 + seed)) * (0.6 + r() * 0.8)),
  );
}
// #endregion

const VIEW_W = 1000;
const CX = 500;
const CY = 318;
const FAR = 4000; // the paper halves reach well past any screen
const FRAME = "36 44 928 468";
const EYES: Pt[] = [
  [-150, -8],
  [150, -14],
];
const WATER_Y = 34; // local y of the waterline: eyes above, snout below

const fill = (c: string): React.CSSProperties => ({ fill: c });
const stop = (c: string, o = 1): React.CSSProperties => ({ stopColor: c, stopOpacity: o });

const d = (pts: Pt[], close = true) =>
  "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + (close ? "Z" : "");

/** Rows of rounded scutes, offset brick-wise, a little uneven. One path, built once. */
function buildScutes() {
  const r = rng(29);
  let s = "";
  for (let row = 0; row < 24; row++) {
    const y = -360 + row * 30;
    const off = row % 2 ? 21 : 0;
    for (let x = -940 + off; x < 940; x += 42) {
      const w = 34 + (r() - 0.5) * 6;
      const h = 23 + (r() - 0.5) * 5;
      const k = 6; // corner
      const x0 = x + (r() - 0.5) * 4;
      const y0 = y + (r() - 0.5) * 4;
      s += `M${(x0 + k).toFixed(1)} ${y0.toFixed(1)}h${(w - 2 * k).toFixed(1)}q${k} 0 ${k} ${k}v${(h - 2 * k).toFixed(1)}q0 ${k} ${-k} ${k}h${(2 * k - w).toFixed(1)}q${-k} 0 ${-k} ${-k}v${(2 * k - h).toFixed(1)}q0 ${-k} ${k} ${-k}Z`;
    }
  }
  return s;
}

/** Bony ridges (osteoderms) over the brow, and the skull bumps between the eyes. */
function buildBumps() {
  const r = rng(41);
  const out: { x: number; y: number; rx: number; ry: number }[] = [];
  for (const y of [-118, -168, -216]) {
    for (let x = -700; x <= 700; x += 58 + r() * 14) {
      out.push({
        x: x + (r() - 0.5) * 10,
        y: y + (r() - 0.5) * 8,
        rx: 16 + r() * 8,
        ry: 10 + r() * 5,
      });
    }
  }
  return out;
}

/** Fine radial fibres in an iris. */
function buildFibres() {
  const r = rng(71);
  let s = "";
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2 + r() * 0.08;
    const r0 = 8 + r() * 4;
    const r1 = 29 + r() * 5;
    s += `M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)}L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`;
  }
  return s;
}

// a crocodile eye: a long, low almond, upper lid heavier than the lower
const ALMOND = "M-66 4 C-44 -40 40 -44 68 -2 C44 30 -40 34 -66 4Z";

const Hide = React.memo(function Hide({ id }: { id: string }) {
  const scutes = React.useMemo(buildScutes, []);
  const bumps = React.useMemo(buildBumps, []);
  return (
    <g>
      <rect x={-2600} y={-420} width={5200} height={840} style={fill("var(--em-croc-800)")} />
      <g filter={`url(#${id}-rough)`}>
        <path d={scutes} style={fill("var(--em-croc-600)")} />
      </g>
      <rect x={-2600} y={-420} width={5200} height={840} fill={`url(#${id}-shade)`} />
      {bumps.map((b, i) => (
        <g key={i}>
          <ellipse
            cx={b.x}
            cy={b.y + 4}
            rx={b.rx}
            ry={b.ry}
            style={fill("var(--em-croc-950)")}
            opacity={0.55}
          />
          <ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#${id}-bump)`} />
        </g>
      ))}
      {/* the raised mounds the eyes sit on */}
      {EYES.map(([x, y], i) => (
        <g key={i}>
          <ellipse
            cx={x}
            cy={y + 12}
            rx={112}
            ry={74}
            style={fill("var(--em-croc-950)")}
            opacity={0.6}
          />
          <ellipse cx={x} cy={y} rx={108} ry={70} fill={`url(#${id}-mound)`} />
        </g>
      ))}
    </g>
  );
});

/** Water from the waterline down, with rings spreading from where the croc broke the surface. */
function Water({ id, rise }: { id: string; rise: number }) {
  const ring = 1 + rise * 0.6;
  return (
    <g>
      <rect x={-2600} y={WATER_Y} width={5200} height={600} fill={`url(#${id}-water)`} />
      <path
        d={`M-2600 ${WATER_Y} H2600`}
        style={{ stroke: "var(--em-ink-0)" }}
        strokeOpacity={0.45}
        strokeWidth={2}
      />
      {EYES.map(([x], i) => (
        <g
          key={i}
          opacity={0.5 * (1 - rise * 0.5)}
          style={{ stroke: "var(--em-ink-0)" }}
          fill="none"
        >
          <ellipse cx={x} cy={WATER_Y + 6} rx={140 * ring} ry={14 * ring} strokeWidth={1.6} />
          <ellipse
            cx={x}
            cy={WATER_Y + 10}
            rx={200 * ring}
            ry={20 * ring}
            strokeWidth={1}
            opacity={0.6}
          />
        </g>
      ))}
    </g>
  );
}

function Eye({
  id,
  x,
  y,
  flip,
  look,
  blink,
  slit,
  scale,
  fibres,
}: {
  id: string;
  x: number;
  y: number;
  flip: boolean;
  look: Pt;
  blink: number;
  slit: number;
  scale: number;
  fibres: string;
}) {
  const clip = id + (flip ? "-cl" : "-cr");
  const lx = look[0] * (flip ? -1 : 1);
  return (
    <g
      transform={`translate(${String(x)} ${String(y)}) scale(${String(flip ? -scale : scale)} ${String(scale)})`}
    >
      <clipPath id={clip}>
        <path d={ALMOND} />
      </clipPath>
      <path
        d={ALMOND}
        style={{ fill: "var(--em-croc-950)", stroke: "var(--em-croc-950)" }}
        strokeWidth={10}
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={0} cy={0} rx={70} ry={46} style={fill("var(--em-croc-800)")} />
        <g transform={`translate(${(lx * 14).toFixed(2)} ${(2 + look[1] * 6).toFixed(2)})`}>
          <circle r={36} fill={`url(#${id}-iris)`} />
          <path d={fibres} style={{ stroke: "var(--em-croc-800)" }} strokeWidth={1} opacity={0.4} />
          <circle
            r={36}
            fill="none"
            style={{ stroke: "var(--em-croc-950)" }}
            strokeWidth={3}
            opacity={0.7}
          />
          {/* the vertical slit; `slit` is its half-width */}
          <ellipse rx={slit} ry={33} style={fill("var(--em-ink-975)")} />
          <ellipse cx={-13} cy={-14} rx={7} ry={5} style={fill("var(--em-ink-0)")} opacity={0.9} />
          <circle cx={10} cy={11} r={2.4} style={fill("var(--em-ink-0)")} opacity={0.55} />
        </g>
        <ellipse cx={0} cy={-42} rx={84} ry={30} fill={`url(#${id}-lid)`} />
        <g transform={`translate(0 ${(-60 + blink * 66).toFixed(2)})`}>
          <rect x={-90} y={-80} width={180} height={80} style={fill("var(--em-croc-600)")} />
          <path d="M-90 0 H90" style={{ stroke: "var(--em-croc-950)" }} strokeWidth={7} />
        </g>
      </g>
    </g>
  );
}

// where the paper curls back over the gap: [x along the tear, half-width, depth]
const CURLS: Record<"top" | "bottom", [number, number, number][]> = {
  top: [
    [300, 44, 30],
    [575, 30, 20],
    [790, 52, 34],
  ],
  bottom: [
    [205, 50, 32],
    [470, 34, 22],
    [690, 40, 28],
  ],
};

function Half({
  id,
  side,
  line,
  open,
  children,
}: {
  id: string;
  side: "top" | "bottom";
  line: Pt[];
  open: number;
  children: React.ReactNode;
}) {
  const up = side === "top";
  const m = pieceMotion(open)[side];
  const first = line[0] ?? [0, CY];
  const last = line[line.length - 1] ?? first;
  const shape: Pt[] = up
    ? [[first[0], -FAR], [last[0], -FAR], ...[...line].reverse()]
    : [...line, [last[0], FAR], [first[0], FAR]];
  const widths = fibreWidths(line.length, open, up ? 5 : 8);
  // the white paper core along the edge, on this half's side of it
  const core = line.concat(
    line.map(([x, y], i): Pt => [x, y + (up ? -1 : 1) * (widths[i] ?? 0)]).reverse(),
  );
  const curls = CURLS[side].map(([cx, hw, depth]) => {
    const pts = line.filter(([x]) => Math.abs(x - cx) <= hw);
    const back = pts.map(([x, y]): Pt => {
      const s = Math.cos(((x - cx) / hw) * (Math.PI / 2));
      return [
        x + (up ? 6 : -6) * s * open,
        y + (up ? 1 : -1) * depth * s * s * Math.min(1, open * 2.5),
      ];
    });
    return d(pts.concat(back.reverse()));
  });
  const clip = `${id}-${side}`;
  return (
    <g
      transform={`translate(${m.dx.toFixed(2)} ${m.dy.toFixed(2)}) rotate(${m.rot.toFixed(3)} ${String(CX)} ${String(CY)})`}
    >
      {open > 0 && (
        <path
          d={d(line, false)}
          fill="none"
          style={{ stroke: "var(--em-ink-975)" }}
          strokeOpacity={0.55 * Math.min(1, open * 3)}
          strokeWidth={22}
          transform={`translate(0 ${up ? 10 : -10})`}
          filter={`url(#${id}-soft)`}
        />
      )}
      <clipPath id={clip}>
        <path d={d(shape)} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>{children}</g>
      {open > 0 && (
        <>
          <path d={d(core)} style={fill("var(--em-ink-0)")} />
          {curls.map((c, i) => (
            <path
              key={i}
              d={c}
              fill={`url(#${id}-curl-${side})`}
              style={{ stroke: "var(--em-ink-0)" }}
              strokeWidth={1}
            />
          ))}
        </>
      )}
    </g>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

type Frame = { p: number; look: Pt; blink: number; squint: number };

export function CrocReveal({
  word,
  tagline,
  hint = "scroll",
  label,
  height = "100svh",
  scrollDistance = "130svh",
  stickyTop = "0px",
  className,
}: {
  /** The big word that gets torn (stretched to a fixed width, so any length fits). */
  word: string;
  /** Small line above the word. */
  tagline?: string;
  /** Text of the scroll hint before the tear starts; empty hides it. */
  hint?: string;
  /** Accessible description of the whole poster. */
  label: string;
  /** Height of the pinned stage: a definite length, never a percentage. */
  height?: string;
  /** Extra scroll distance the tear plays over. */
  scrollDistance?: string;
  /** Where the stage pins, e.g. under a sticky header (match `height` to what is left). */
  stickyTop?: string;
  className?: string;
}) {
  const rootRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const id = "ccr" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const fibres = React.useMemo(buildFibres, []);
  const line = React.useMemo(() => tearLine(), []);
  const [f, setF] = React.useState<Frame>({ p: 0, look: [0, 0], blink: 0, squint: 0 });
  const reducedRef = React.useRef(reduced);
  React.useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const squintAt = React.useRef(-1e9);

  React.useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    let raf = 0;
    let visible = true;
    let p = 0;
    let look: Pt = [0, 0];
    let idle: Pt = [0, 0];
    let nextIdle = 0;
    let nextBlink = performance.now() + 2500;
    let last: Frame | null = null;

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const still = reducedRef.current;
      const target = scrollProgress(
        root.getBoundingClientRect().top,
        root.offsetHeight,
        stage.offsetHeight,
      );
      p = still ? (target > 0.3 ? 1 : 0) : p + (target - p) * 0.14;
      if (Math.abs(target - p) < 0.0005) p = target;

      // where the eyes look: the pointer if there is one, else a slow wandering gaze
      let want: Pt;
      if (pointer.current) {
        const r = stage.getBoundingClientRect();
        want = [
          Math.max(-1, Math.min(1, (pointer.current.x - r.left - r.width / 2) / (r.width * 0.35))),
          Math.max(
            -1,
            Math.min(1, (pointer.current.y - r.top - r.height * 0.5) / (r.height * 0.35)),
          ),
        ];
      } else {
        if (now > nextIdle && !still) {
          const g = rng(Math.floor(now));
          idle = [(g() - 0.5) * 1.4, (g() - 0.5) * 0.6];
          nextIdle = now + 1800 + g() * 2200;
        }
        want = still ? [0, 0] : idle;
      }
      look = [look[0] + (want[0] - look[0]) * 0.12, look[1] + (want[1] - look[1]) * 0.12];

      // a slow reptile blink every few seconds
      let blink = 0;
      if (!still) {
        const since = now - nextBlink;
        if (since > 0)
          blink = since < 140 ? since / 140 : since < 320 ? 1 - (since - 140) / 180 : 0;
        if (since > 320) nextBlink = now + 3200 + Math.random() * 3800;
      }
      const squint = still ? 0 : Math.max(0, 1 - (now - squintAt.current) / 900);

      const next: Frame = { p, look, blink, squint };
      if (
        !last ||
        Math.abs(next.p - last.p) > 1e-4 ||
        Math.abs(next.look[0] - last.look[0]) > 1e-3 ||
        Math.abs(next.look[1] - last.look[1]) > 1e-3 ||
        next.blink !== last.blink ||
        next.squint !== last.squint
      ) {
        last = next;
        setF(next);
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const s = stages(f.p);
  const pop = reduced ? s.pop : easeOutBack(s.pop);
  const eyeScale = 0.9 + 0.1 * pop;
  // the slit is wide in the dark of the closed paper, narrows in the light, and to a thread on click
  const slit = Math.max(1.5, 13 - 8 * s.pop - 7 * f.squint);
  const blink = Math.max(1 - clamp01(pop), f.blink, f.squint * 0.35);
  const rise = (1 - s.rise) * 150;
  const shake = reduced ? 0 : Math.sin(f.p * 900) * 6 * s.shake;
  const crackReach = s.crack * 620;
  const crack = line.filter(([x]) => Math.abs(x - CX) <= crackReach);
  const croc = `translate(${String(CX)} ${(CY + rise).toFixed(2)}) rotate(-7) scale(${(1.34 - 0.06 * s.rise).toFixed(4)})`;

  const sheet = (
    <>
      <rect
        x={-FAR}
        y={-FAR}
        width={FAR * 2 + VIEW_W}
        height={FAR * 2}
        style={fill("var(--background)")}
      />
      {tagline && (
        <text
          x={CX}
          y={150}
          textAnchor="middle"
          style={{
            fill: "var(--foreground)",
            fontFamily: "inherit",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {tagline}
        </text>
      )}
      <text
        x={CX}
        y={404}
        textAnchor="middle"
        textLength={840}
        lengthAdjust="spacingAndGlyphs"
        style={{
          fill: "var(--em-blue-600)",
          fontFamily: "inherit",
          fontSize: 250,
          fontWeight: 900,
        }}
      >
        {word}
      </text>
    </>
  );

  return (
    <section
      ref={rootRef}
      className={cn("vt-live relative w-full bg-background", className)}
      style={{ height: `calc(${height} + ${scrollDistance})`, overflow: "clip" }}
    >
      <div
        ref={stageRef}
        className="sticky w-full overflow-hidden"
        style={{ top: stickyTop, height, cursor: s.pop > 0.9 ? "crosshair" : undefined }}
        onPointerMove={(e) => (pointer.current = { x: e.clientX, y: e.clientY })}
        onPointerLeave={() => (pointer.current = null)}
        onPointerDown={() => {
          if (s.pop > 0.5) squintAt.current = performance.now();
        }}
      >
        <svg
          viewBox={FRAME}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={label}
          className="absolute inset-0 block size-full max-w-none"
        >
          <defs>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop("var(--em-croc-950)", 0.5)} />
              <stop offset="0.45" style={stop("var(--em-croc-200)", 0.1)} />
              <stop offset="1" style={stop("var(--em-croc-950)", 0.55)} />
            </linearGradient>
            <radialGradient id={`${id}-bump`} cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" style={stop("var(--em-croc-400)")} />
              <stop offset="1" style={stop("var(--em-croc-800)")} />
            </radialGradient>
            <radialGradient id={`${id}-mound`} cx="0.45" cy="0.3" r="0.75">
              <stop offset="0" style={stop("var(--em-croc-400)")} />
              <stop offset="0.6" style={stop("var(--em-croc-600)")} />
              <stop offset="1" style={stop("var(--em-croc-800)")} />
            </radialGradient>
            <radialGradient id={`${id}-iris`}>
              <stop offset="0" style={stop("var(--em-gold-300)")} />
              <stop offset="0.45" style={stop("var(--em-gold-500)")} />
              <stop offset="0.85" style={stop("var(--em-croc-400)")} />
              <stop offset="1" style={stop("var(--em-croc-800)")} />
            </radialGradient>
            <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop("var(--em-ink-975)", 0.75)} />
              <stop offset="1" style={stop("var(--em-ink-975)", 0)} />
            </linearGradient>
            <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop("var(--em-blue-500)", 0.78)} />
              <stop offset="1" style={stop("var(--em-blue-700)", 0.95)} />
            </linearGradient>
            <linearGradient id={`${id}-curl-top`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={stop("var(--em-ink-0)")} />
              <stop offset="1" style={stop("var(--em-ink-200)")} />
            </linearGradient>
            <linearGradient id={`${id}-curl-bottom`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" style={stop("var(--em-ink-0)")} />
              <stop offset="1" style={stop("var(--em-ink-200)")} />
            </linearGradient>
            <filter id={`${id}-soft`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id={`${id}-rough`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="6" />
            </filter>
            <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${shake.toFixed(2)} ${(shake * 0.4).toFixed(2)})`}>
            {/* behind the paper: the croc, surfacing into the gap */}
            {s.open > 0 && (
              <g transform={croc}>
                <Hide id={id} />
                <g filter={s.pop > 0.02 ? `url(#${id}-glow)` : undefined}>
                  {EYES.map(([x, y], i) => (
                    <Eye
                      key={i}
                      id={id}
                      x={x}
                      y={y}
                      flip={i === 0}
                      look={f.look}
                      blink={blink}
                      slit={slit}
                      scale={eyeScale}
                      fibres={fibres}
                    />
                  ))}
                </g>
                <Water id={id} rise={s.rise} />
              </g>
            )}

            {/* the sheet: whole until it tears, then two halves parting along the tear */}
            {s.open > 0 ? (
              <>
                <Half id={id} side="top" line={line} open={s.open}>
                  {sheet}
                </Half>
                <Half id={id} side="bottom" line={line} open={s.open}>
                  {sheet}
                </Half>
              </>
            ) : (
              sheet
            )}

            {s.crack > 0 && s.open < 0.15 && crack.length > 1 && (
              <path
                d={d(crack, false)}
                fill="none"
                style={{ stroke: "var(--foreground)" }}
                strokeWidth={2.4}
                strokeLinejoin="bevel"
                opacity={1 - s.open / 0.15}
              />
            )}
          </g>
        </svg>

        {hint && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground"
            style={{ opacity: Math.max(0, 0.8 - s.crack * 3) }}
          >
            {hint}
            <span className="block h-6 w-px animate-pulse bg-current motion-reduce:animate-none" />
          </div>
        )}
      </div>
    </section>
  );
}
