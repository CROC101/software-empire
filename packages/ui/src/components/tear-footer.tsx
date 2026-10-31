"use client";

import * as React from "react";
import { useTokenColors } from "../lib/token-colors";
import { InkWordmark } from "./ink-wordmark";

/**
 * Tear footer: the footer as a torn poster. A blue sheet carries the chrome (back to top,
 * socials, logo, contact corner, an invite pill, a live clock, two link columns); its bottom
 * has been ripped away from a glossy pushpin and the brand is printed on the paper underneath.
 * On scroll-in the chrome assembles, the pin drops and stabs, and the sheet rips from the pin
 * outwards with a white fibre rim and curled flaps. Click the pin to re-rip a new edge.
 *
 * Adapted from "Pushpin Tear Footer" (21st.dev, kedhareswer): colours come from palette tokens
 * (re-read on theme switch), the newsletter became an invite link, the monogram is a prop.
 * No dependencies; the tear, flaps, grain and pin are SVG and canvas built from numbers. The
 * animation loop runs only while something moves.
 */

// #region tear geometry
type Flap = { at: number; span: number; len: number; skew: number; dir: number; jag: number[] };
type Tear = { ys: number[]; rim: number[]; lag: number[]; flaps: Flap[] };

const RIDGE_N = 84;
/** Off-screen start: the ridge begins below the bottom edge, so the sheet is whole. */
const START = 1.06;
const FLAPS = 6;

const clamp01 = (v: number) => (Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0);

/** mulberry32: small and seedable, the same tear for the same seed everywhere. */
export function rng(seed: number) {
  let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ridge x positions, shared by every seed so one tear can morph into another. */
const XS: number[] = (() => {
  const r = rng(911);
  const out: number[] = [];
  for (let i = 0; i < RIDGE_N; i++) {
    const u = i / (RIDGE_N - 1);
    const j = i > 0 && i < RIDGE_N - 1 ? (r() - 0.5) * (0.8 / RIDGE_N) : 0;
    out.push(-0.02 + u * 1.04 + j);
  }
  return out;
})();

/** The lowest the ridge may climb at x, so it never crosses the poster's content. */
function ridgeFloor(x: number) {
  const d = Math.abs(x - 0.5);
  if (d < 0.13) return 0.39;
  if (d < 0.25) return 0.43;
  return 0.5;
}

export function makeTear(seed: number): Tear {
  const r = rng(seed);
  const ph = [r() * 6.283, r() * 6.283, r() * 6.283] as const;
  const ys: number[] = [];
  const rim: number[] = [];
  const lag: number[] = [];
  for (let i = 0; i < RIDGE_N; i++) {
    const x = XS[i] ?? 0;
    const d = Math.min(1, Math.abs(x - 0.5) * 2);
    // a mountain: lowest under the pin, falling away to both edges
    const base = 0.43 + 0.3 * Math.pow(d, 1.35);
    const wander =
      (0.022 * Math.sin(x * 7 + ph[0]) +
        0.016 * Math.sin(x * 13 + ph[1]) +
        0.01 * Math.sin(x * 29 + ph[2])) *
      (0.45 + 0.55 * d);
    const spike = r() < 0.16 ? 2.3 : 1;
    const jag = (r() - 0.5) * 0.022 * spike;
    ys.push(Math.min(0.8, Math.max(ridgeFloor(x), base + wander + jag)));
    rim.push(1.2 + r() * 3.6);
    // rips from the pin outwards
    lag.push(Math.min(0.48, d * 0.4 + 0.04 + 0.03 * Math.sin(x * 23 + ph[1]) + r() * 0.012));
  }
  // six flaps: the outer two big curls, two mid, two small ones curling back over the sheet
  const slots = [0.05, 0.19, 0.33, 0.67, 0.81, 0.95];
  const up = r() < 0.5 ? [2, 4] : [1, 3];
  const flaps: Flap[] = slots.map((slot, k) => {
    const x = slot + (r() - 0.5) * 0.05;
    const span = 3 + Math.floor(r() * 5);
    const at = Math.max(0, Math.min(RIDGE_N - 1 - span, Math.round(x * (RIDGE_N - 1))));
    const dir = up.includes(k) ? -1 : 1;
    const outer = k === 0 || k === slots.length - 1;
    const len = dir < 0 ? 0.022 + r() * 0.022 : outer ? 0.085 + r() * 0.04 : 0.045 + r() * 0.05;
    return {
      at,
      span,
      len,
      skew: (r() - 0.5) * 1.1,
      dir,
      jag: [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5],
    };
  });
  return { ys, rim, lag, flaps };
}

/** Ease out with a small overshoot: the paper rips a hair too far and settles. */
export function easeTear(t: number) {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  const c1 = 0.9;
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const introYs = (tear: Tear, t: number) =>
  tear.ys.map((y, i) => START + (y - START) * easeTear((t - (tear.lag[i] ?? 0)) / 0.5));

const morphYs = (from: number[], to: Tear, t: number) =>
  to.ys.map((y, i) => {
    const a = from[i] ?? y;
    return a + (y - a) * easeInOut((t - (to.lag[i] ?? 0) * 0.6) / 0.6);
  });

const flapOpen = (tear: Tear, f: Flap, t: number) =>
  easeTear((t - (tear.lag[f.at] ?? 0) - 0.18) / 0.32);

/** A flap: the ridge segment it hangs from, then two jagged free edges meeting at its tip. */
function flapPoly(ys: number[], f: Flap, W: number, H: number, open: number) {
  const b = Math.min(ys.length - 1, f.at + f.span);
  const top: [number, number][] = [];
  for (let k = f.at; k <= b; k++) top.push([(XS[k] ?? 0) * W, (ys[k] ?? 0) * H]);
  const A = top[0] ?? [0, 0];
  const B = top[top.length - 1] ?? A;
  const L = f.len * H * Math.max(0, open);
  const tip: [number, number] = [(A[0] + B[0]) / 2 + f.skew * L, (A[1] + B[1]) / 2 + f.dir * L];
  const side = (
    P: [number, number],
    Q: [number, number],
    j0: number,
    j1: number,
  ): [number, number][] => {
    const dx = Q[0] - P[0];
    const dy = Q[1] - P[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return [
      [P[0] + dx / 3 + nx * j0 * 0.22 * L, P[1] + dy / 3 + ny * j0 * 0.22 * L],
      [P[0] + (dx * 2) / 3 + nx * j1 * 0.22 * L, P[1] + (dy * 2) / 3 + ny * j1 * 0.22 * L],
    ];
  };
  const [j0 = 0, j1 = 0, j2 = 0, j3 = 0] = f.jag;
  return [...top, ...side(B, tip, j0, j1), tip, ...side(tip, A, j2, j3)];
}

const n1 = (v: number) => Math.round(v * 10) / 10;

const polyD = (pts: [number, number][]) =>
  pts.length ? "M" + pts.map((p) => `${String(n1(p[0]))} ${String(n1(p[1]))}`).join("L") + "Z" : "";

/** The sheet: everything above the ridge, lifted by `off` pixels per point (the fibre rim). */
function sheetD(ys: number[], W: number, H: number, off?: number[]) {
  let d = `M-20 -20L${String(W + 20)} -20`;
  for (let i = ys.length - 1; i >= 0; i--)
    d += `L${String(n1((XS[i] ?? 0) * W))} ${String(n1((ys[i] ?? 0) * H - (off?.[i] ?? 0)))}`;
  return d + "Z";
}

/** Mix two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => {
    const s = h.replace("#", "");
    const f = s.length === 3 ? s.replace(/./g, "$&$&") : s.padEnd(6, "0").slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0);
  };
  const x = p(a);
  const y = p(b);
  const k = clamp01(t);
  return (
    "#" +
    x
      .map((v, i) =>
        Math.round(v + ((y[i] ?? 0) - v) * k)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
// #endregion

type IconName = "github" | "globe" | "link";
export type TearLink = { label: string; href: string };
export type TearIconLink = TearLink & { icon: IconName };
export type TearColumn = { title: string; links: TearLink[]; cta?: TearLink };

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icon({ name }: { name: IconName | "chevL" | "copy" | "squiggle" | "arrow" }) {
  const svg = (children: React.ReactNode, filled?: boolean) => (
    <svg
      viewBox="0 0 24 24"
      className="tpf-ico"
      aria-hidden
      {...(filled ? { fill: "currentColor" } : STROKE)}
    >
      {children}
    </svg>
  );
  switch (name) {
    case "chevL":
      return svg(<path d="M14.5 5.5 8 12l6.5 6.5" />);
    case "arrow":
      return svg(<path d="M5 12h13M13 6.5 18.5 12 13 17.5" />);
    case "copy":
      return svg(
        <>
          <path d="M13.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5" />
          <circle cx="18.5" cy="5.5" r="2.3" />
        </>,
      );
    case "squiggle":
      return svg(<path d="M3.5 15c1.8-3.2 3.6-3.2 5.4 0s3.6 3.2 5.4 0 3.6-3.2 5.4 0" />);
    case "github":
      return svg(
        <path
          fillRule="evenodd"
          d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.1-1.1-3.1-1.1-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.8.1-.6.3-1 .6-1.2-2.1-.2-4.2-1-4.2-4.6 0-1 .4-1.8 1-2.5-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a8.8 8.8 0 0 1 4.6 0c1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.5 0 3.6-2.2 4.4-4.2 4.6.3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8z"
        />,
        true,
      );
    case "globe":
      return svg(
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z" />
        </>,
      );
    case "link":
      return svg(
        <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />,
      );
  }
}

/** Live local time with a blinking colon; empty until mounted so SSR never mismatches. */
function Clock({ zone, label }: { zone: string; label: string }) {
  const [t, setT] = React.useState(["--", "--"]);
  React.useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: zone,
    });
    const tick = () => setT(f.format(new Date()).split(":"));
    tick();
    const id = window.setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [zone]);
  return (
    <span className="tpf-clock">
      {label} {t[0]}
      <i aria-hidden>:</i>
      {t[1]}
    </span>
  );
}

/** The pushpin: glossy domed cap, waisted neck, flange, steel needle. Shaded from `base`. */
function Pin({ base, id }: { base: string; id: string }) {
  const hi = mixHex(base, "#ffffff", 0.62);
  const lo = mixHex(base, "#000000", 0.42);
  const deep = mixHex(base, "#000000", 0.66);
  const t = { transition: "stop-color .7s ease" };
  const side = (gid: string) => (
    <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" style={{ ...t, stopColor: lo }} />
      <stop offset=".24" style={{ ...t, stopColor: base }} />
      <stop offset=".4" style={{ ...t, stopColor: hi }} />
      <stop offset=".58" style={{ ...t, stopColor: base }} />
      <stop offset="1" style={{ ...t, stopColor: deep }} />
    </linearGradient>
  );
  const url = (s: string) => `url(#${id}${s})`;
  return (
    <svg viewBox="0 0 100 200" className="tpf-pin-svg" aria-hidden>
      <defs>
        {side(id + "s")}
        <radialGradient id={id + "t"} cx=".38" cy=".3" r=".8">
          <stop offset="0" style={{ ...t, stopColor: hi }} />
          <stop offset=".55" style={{ ...t, stopColor: base }} />
          <stop offset="1" style={{ ...t, stopColor: lo }} />
        </radialGradient>
        <linearGradient id={id + "n"} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5b616b" />
          <stop offset=".4" stopColor="#f4f5f7" />
          <stop offset=".7" stopColor="#a3a9b2" />
          <stop offset="1" stopColor="#4a4f57" />
        </linearGradient>
        <filter id={id + "b"} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <path d="M48.3 112h3.4l-.7 76-1 4-1-4z" fill={url("n")} />
      <ellipse cx="50" cy="191.5" rx="3.2" ry="1.1" fill="#0b1a33" opacity=".35" />
      <path d="M28 103v6.5a22 7 0 0 0 44 0V103z" fill={url("s")} />
      <ellipse cx="50" cy="103" rx="22" ry="7" fill={url("t")} />
      <path
        d="M41.5 38c1.6 16 4.6 26 3 36-1.8 10-13 19-14.6 29h40.2c-1.6-10-12.8-19-14.6-29-1.6-10 1.4-20 3-36z"
        fill={url("s")}
      />
      <path d="M16 22v14a34 13 0 0 0 68 0V22z" fill={url("s")} />
      <ellipse cx="50" cy="22" rx="34" ry="13" fill={url("t")} />
      <ellipse
        cx="50"
        cy="22"
        rx="33"
        ry="12.3"
        fill="none"
        stroke="#fff"
        strokeOpacity=".28"
        strokeWidth=".8"
      />
      <ellipse cx="37" cy="17.5" rx="12" ry="4" fill="#fff" opacity=".7" filter={url("b")} />
      <path
        d="M22 38c4 4.5 9.5 6.4 15 7"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        filter={url("b")}
      />
      <path
        d="M45 50c.8 8 1.6 14 .8 22"
        stroke="#fff"
        strokeOpacity=".45"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);
  return reduced;
}

function A({
  href,
  className,
  label,
  children,
  style,
}: {
  href: string;
  className?: string;
  label?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const out = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      aria-label={label}
      title={label}
      style={style}
      {...(out ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

// sheet, paper, ink on the sheet, ink on the paper
const TOKENS = ["--em-blue-600", "--background", "--em-ink-0", "--em-blue-500"] as const;
const FALLBACK = ["#2563eb", "#f7f7f5", "#ffffff", "#3b82f6"];

export type TearFooterProps = {
  /** The wordmark printed on the paper. */
  brand: string;
  /** Stamps the wordmark in dry-brush ink with a crocodile peeking (InkWordmark). */
  ink?: boolean;
  /** Small gradient line over the wordmark. */
  name: string;
  /** Centre of the top bar (a logo). */
  logo: React.ReactNode;
  logoHref: string;
  socials?: TearIconLink[];
  /** Top-right corner: copies `email` when given, otherwise a link. */
  email?: string;
  corner?: TearLink;
  /** Where the old newsletter sat: a pill that links somewhere. */
  invite?: { label: string; text: string; href: string } | null;
  status?: TearLink | null;
  /** Small text left of the invite. */
  mark?: string;
  /** IANA zone for the live clock right of the invite. */
  timeZone?: string;
  timeLabel?: string;
  columns: [TearColumn, TearColumn];
  chat?: TearLink | null;
  /** Two links either side of the wordmark. */
  sideLinks?: [TearIconLink, TearIconLink];
  copyright: string;
  credit?: string;
  handle?: TearLink;
  seed?: number;
  /** Labels for the controls (screen readers). */
  labels?: { top: string; pin: string; copied: string; copy: string };
  className?: string;
};

export function TearFooter({
  brand,
  name,
  logo,
  logoHref,
  socials = [],
  email,
  corner,
  invite = null,
  status = null,
  mark,
  timeZone,
  timeLabel = "",
  columns,
  chat = null,
  sideLinks,
  copyright,
  credit,
  handle,
  seed = 7,
  ink = false,
  labels = {
    top: "Back to top",
    pin: "Pull the pin: tear a new edge",
    copied: "copied",
    copy: "Copy",
  },
  className = "",
}: TearFooterProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const rootRef = React.useRef<HTMLElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const sheetRef = React.useRef<SVGPathElement>(null);
  const rimRef = React.useRef<SVGPathElement>(null);
  const flapRefs = React.useRef<(SVGPathElement | null)[]>([]);
  const gradRefs = React.useRef<(SVGLinearGradientElement | null)[]>([]);
  const pinRef = React.useRef<HTMLButtonElement>(null);
  const timers = React.useRef<number[]>([]);

  const still = useReducedMotion();
  const [sheet, paper, sheetInk, paperInk] = (useTokenColors(TOKENS) ?? FALLBACK) as [
    string,
    string,
    string,
    string,
  ];
  const [stage, setStage] = React.useState(0);
  const [hit, setHit] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [pin, setPin] = React.useState<"idle" | "lift" | "stab">("idle");
  const [toast, setToast] = React.useState("");
  const [grain, setGrain] = React.useState("");

  // mutable animation state: read and written by the frame loop without re-rendering
  const [s] = React.useState(() => ({
    W: 0,
    H: 0,
    tear: makeTear(seed),
    prev: null as Tear | null,
    from: [] as number[],
    ys: [] as number[],
    mode: "wait",
    t0: 0,
    dur: 1,
    raf: 0,
    px: -1e4,
    py: -1e4,
    lift: new Array<number>(FLAPS).fill(0),
    still: false,
    busy: false,
    seed,
  }));
  React.useEffect(() => {
    s.still = still;
  }, [s, still]);

  const later = React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // ---- drawing ----------------------------------------------------------------
  const frame = React.useCallback(
    function frame(now: number) {
      s.raf = 0;
      const { W, H, tear } = s;
      if (!W || !H) return;
      let busy = false;
      let ys: number[];
      const open = new Array<number>(FLAPS).fill(1);
      const openOld = new Array<number>(FLAPS).fill(0);
      if (s.mode === "wait") {
        ys = tear.ys.map(() => START);
        open.fill(0);
      } else if (s.mode === "intro") {
        const p = (now - s.t0) / s.dur;
        ys = introYs(tear, Math.min(1, p));
        tear.flaps.forEach((f, k) => (open[k] = flapOpen(tear, f, Math.min(1, p))));
        if (p >= 1) s.mode = "rest";
        else busy = true;
      } else if (s.mode === "morph") {
        const p = (now - s.t0) / s.dur;
        ys = morphYs(s.from, tear, Math.min(1, p));
        open.fill(easeTear((p - 0.5) / 0.5));
        openOld.fill(1 - easeInOut(p / 0.35));
        if (p >= 1) s.mode = "rest";
        else busy = true;
      } else ys = tear.ys;
      s.ys = ys;

      // flaps lift towards a nearby pointer
      tear.flaps.forEach((f, k) => {
        const b = Math.min(ys.length - 1, f.at + f.span);
        const mx = (((XS[f.at] ?? 0) + (XS[b] ?? 0)) / 2) * W;
        const my = (((ys[f.at] ?? 0) + (ys[b] ?? 0)) / 2) * H;
        const target = s.still
          ? 0
          : clamp01(1 - Math.hypot(s.px - mx, s.py - my) / (0.2 * Math.max(W, 520)));
        const lift = (s.lift[k] ?? 0) + (target - (s.lift[k] ?? 0)) * 0.14;
        s.lift[k] = lift;
        if (Math.abs(target - lift) > 0.003) busy = true;
        open[k] = (open[k] ?? 1) * (1 + 0.32 * lift);
      });

      sheetRef.current?.setAttribute("d", sheetD(ys, W, H, tear.rim));
      rimRef.current?.setAttribute("d", sheetD(ys, W, H));
      const draw = (k: number, f: Flap | undefined, o: number) => {
        const el = flapRefs.current[k];
        const g = gradRefs.current[k];
        if (!el || !g) return;
        if (!f || o < 0.01) {
          el.setAttribute("d", "");
          return;
        }
        const pts = flapPoly(ys, f, W, H, o);
        el.setAttribute("d", polyD(pts));
        const b = Math.min(ys.length - 1, f.at + f.span);
        const tip = pts[f.span + 3] ?? [0, 0];
        g.setAttribute("x1", String((((XS[f.at] ?? 0) + (XS[b] ?? 0)) / 2) * W));
        g.setAttribute("y1", String((((ys[f.at] ?? 0) + (ys[b] ?? 0)) / 2) * H));
        g.setAttribute("x2", String(tip[0]));
        g.setAttribute("y2", String(tip[1]));
      };
      for (let k = 0; k < FLAPS; k++) {
        draw(k, tear.flaps[k], open[k] ?? 0);
        draw(FLAPS + k, s.prev?.flaps[k], openOld[k] ?? 0);
      }
      if (busy) s.raf = requestAnimationFrame(frame);
    },
    [s],
  );

  const kick = React.useCallback(() => {
    if (!s.raf) s.raf = requestAnimationFrame(frame);
  }, [s, frame]);

  // size
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      s.W = el.clientWidth;
      s.H = el.clientHeight;
      const svg = svgRef.current;
      if (svg) {
        svg.setAttribute("width", String(s.W));
        svg.setAttribute("height", String(s.H));
        svg.setAttribute("viewBox", `0 0 ${String(s.W)} ${String(s.H)}`);
      }
      kick();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [s, kick]);

  // visibility
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), {
      threshold: 0.22,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // grain tile, once
  React.useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(160, 160);
    const r = rng(42);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.floor(r() * 46);
    }
    g.putImageData(img, 0, 0);
    setGrain(c.toDataURL());
  }, []);

  // the opening: chrome, pin, rip
  React.useEffect(() => {
    if (!visible || stage > 0) return;
    if (still) {
      setStage(3);
      s.mode = "rest";
      kick();
      return;
    }
    setStage(1);
    later(() => setStage(2), 640);
    later(() => {
      setHit(true);
      setStage(3);
      s.mode = "intro";
      s.t0 = performance.now();
      s.dur = 1550;
      kick();
    }, 1140);
    later(() => setHit(false), 1480);
  }, [visible, stage, still, s, kick, later]);

  React.useEffect(() => {
    const ids = timers.current;
    return () => ids.forEach((id) => clearTimeout(id));
  }, []);

  // ---- actions ----------------------------------------------------------------
  const onPointerMove = (e: React.PointerEvent) => {
    const el = rootRef.current;
    if (!el || s.still) return;
    const r = el.getBoundingClientRect();
    s.px = e.clientX - r.left;
    s.py = e.clientY - r.top;
    const tilt = Math.max(-9, Math.min(9, (s.px / r.width - 0.5) * 18));
    pinRef.current?.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    kick();
  };
  const onPointerLeave = () => {
    s.px = s.py = -1e4;
    pinRef.current?.style.setProperty("--tilt", "0deg");
    kick();
  };

  const repin = () => {
    if (s.busy || stage < 3) return;
    const swap = () => {
      s.seed += 1;
      s.prev = s.tear;
      s.from = s.ys.length ? s.ys : s.tear.ys;
      s.tear = makeTear(s.seed);
    };
    if (still) {
      swap();
      s.prev = null;
      s.mode = "rest";
      kick();
      return;
    }
    s.busy = true;
    setPin("lift");
    later(() => {
      swap();
      s.mode = "morph";
      s.t0 = performance.now();
      s.dur = 1150;
      kick();
    }, 300);
    later(() => setPin("stab"), 1280);
    later(() => {
      setPin("idle");
      s.busy = false;
    }, 1720);
  };

  const copyEmail = () => {
    if (!email) return;
    const flash = (msg: string) => {
      setToast(msg);
      later(() => setToast(""), 1600);
    };
    navigator.clipboard.writeText(email).then(
      () => flash(labels.copied),
      () => flash(email),
    );
  };
  const toTop = () => window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });

  // ---- colours ----------------------------------------------------------------
  // flaps are the back of the sheet: paper-white
  const flapBase = mixHex(paper, "#ffffff", 0.35);
  const vars = {
    "--tpf-sheet": sheet,
    "--tpf-paper": paper,
    "--tpf-on-sheet": sheetInk,
    "--tpf-on-paper": paperInk,
    "--tpf-rim": mixHex(flapBase, "#ffffff", 0.6),
  } as React.CSSProperties;
  const H = (i: number) => ({ "--i": i }) as React.CSSProperties;
  const cls = [
    "tpf",
    stage >= 1 && "s1",
    stage >= 2 && "s2",
    stage >= 3 && "s3",
    hit && "is-hit",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      ref={rootRef}
      className={cls}
      style={vars}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <svg ref={svgRef} className="tpf-stage" aria-hidden>
        <defs>
          <radialGradient id={uid + "v"} cx=".5" cy=".78" r=".75">
            <stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#0d1c38" stopOpacity=".07" />
          </radialGradient>
          <linearGradient id={uid + "l"} x1="0" y1="0" x2=".35" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".13" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#001033" stopOpacity=".12" />
          </linearGradient>
          {grain && (
            <pattern id={uid + "g"} width="160" height="160" patternUnits="userSpaceOnUse">
              <image href={grain} width="160" height="160" />
            </pattern>
          )}
          <filter id={uid + "d"} x="-5%" y="-5%" width="110%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0a1a3a" floodOpacity=".3" />
          </filter>
          <filter id={uid + "f"} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="-2" dy="4" stdDeviation="4" floodColor="#0a1a3a" floodOpacity=".26" />
          </filter>
          {Array.from({ length: FLAPS * 2 }, (_, k) => (
            <linearGradient
              key={k}
              id={`${uid}fg${String(k)}`}
              ref={(el) => {
                gradRefs.current[k] = el;
              }}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor={mixHex(flapBase, "#1c2a44", 0.34)} />
              <stop offset=".5" stopColor={mixHex(flapBase, "#1c2a44", 0.08)} />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          ))}
          <path id={uid + "s"} ref={sheetRef} />
        </defs>
        <rect className="tpf-paper" width="100%" height="100%" />
        <rect
          width="100%"
          height="100%"
          fill={`url(#${uid}v)`}
          style={{ mixBlendMode: "multiply" }}
        />
        {grain && <rect width="100%" height="100%" fill={`url(#${uid}g)`} opacity=".32" />}
        <g className="tpf-sheet-g" filter={`url(#${uid}d)`}>
          <path ref={rimRef} className="tpf-rim" />
          <use href={`#${uid}s`} className="tpf-sheet" />
        </g>
        <use href={`#${uid}s`} fill={`url(#${uid}l)`} />
        {grain && <use href={`#${uid}s`} fill={`url(#${uid}g)`} opacity=".5" />}
        <g filter={`url(#${uid}f)`}>
          {Array.from({ length: FLAPS * 2 }, (_, k) => (
            <path
              key={k}
              ref={(el) => {
                flapRefs.current[k] = el;
              }}
              fill={`url(#${uid}fg${String(k)})`}
            />
          ))}
        </g>
      </svg>

      {/* ---- on the sheet ---- */}
      <div className="tpf-z tpf-top">
        <div className="tpf-row tpf-h" style={H(0)}>
          <button
            type="button"
            className="tpf-ib tpf-up"
            onClick={toTop}
            aria-label={labels.top}
            title={labels.top}
          >
            <Icon name="chevL" />
          </button>
          <span style={{ width: ".6em" }} />
          {socials.map((l) => (
            <A key={l.href} href={l.href} className="tpf-ib" label={l.label}>
              <Icon name={l.icon} />
            </A>
          ))}
        </div>
        <A href={logoHref} className="tpf-logo tpf-h" label={name} style={H(1)}>
          {logo}
        </A>
        <div className="tpf-h" style={{ ...H(2), position: "relative" }}>
          {email ? (
            <button
              type="button"
              className="tpf-mail"
              onClick={copyEmail}
              aria-label={`${labels.copy} ${email}`}
              title={labels.copy}
            >
              <span>{email}</span>
              <Icon name="copy" />
            </button>
          ) : (
            corner && (
              <A href={corner.href} className="tpf-mail">
                <span>{corner.label}</span>
                <Icon name="arrow" />
              </A>
            )
          )}
          <span className={"tpf-toast" + (toast ? " on" : "")} role="status" aria-live="polite">
            {toast}
          </span>
        </div>
      </div>

      {invite && (
        <div className="tpf-z tpf-news tpf-h" style={H(3)}>
          <span>{invite.label}</span>
          <A href={invite.href} className="tpf-pill">
            <span className="tpf-pill-text">{invite.text}</span>
            <span className="tpf-knob">
              <Icon name="arrow" />
            </span>
          </A>
        </div>
      )}

      {mark && (
        <span className="tpf-z tpf-flank tpf-h" style={{ ...H(4), left: "24%" }}>
          {mark}
        </span>
      )}
      {timeZone && (
        <span className="tpf-z tpf-flank tpf-h" style={{ ...H(4), left: "76%" }} title={timeZone}>
          <Clock zone={timeZone} label={timeLabel} />
        </span>
      )}

      {status && (
        <A href={status.href} className="tpf-z tpf-status tpf-h" style={H(5)}>
          <i className="tpf-live" aria-hidden />
          <span>{status.label}</span>
        </A>
      )}

      {columns.map((c, i) => (
        <nav
          key={c.title}
          className={"tpf-z tpf-col tpf-h " + (i ? "r" : "l")}
          style={H(6 + i)}
          aria-label={c.title}
        >
          <h3>
            {c.title}
            <Icon name="squiggle" />
          </h3>
          <ul>
            {c.links.map((l) => (
              <li key={l.href}>
                <A href={l.href}>{l.label}</A>
              </li>
            ))}
          </ul>
          {c.cta && (
            <A href={c.cta.href} className="tpf-big">
              {c.cta.label}
            </A>
          )}
        </nav>
      ))}

      {/* ---- the pin ---- */}
      <button
        ref={pinRef}
        type="button"
        className="tpf-pin"
        data-pin={pin}
        onClick={repin}
        aria-label={labels.pin}
        title={labels.pin}
      >
        <span className="tpf-shadow" aria-hidden />
        <span className="tpf-tilt">
          <span className="tpf-drop">
            <span className="tpf-body">
              <Pin base={sheet} id={uid + "p"} />
            </span>
          </span>
        </span>
      </button>

      {/* ---- printed on the paper ---- */}
      <div className="tpf-z tpf-brand tpf-ink">
        <div className="tpf-brand-top tpf-p" style={H(0)}>
          <span className="tpf-eye">{name}</span>
          {chat && (
            <A href={chat.href} className="tpf-bub" label={chat.label}>
              <span className="tpf-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <b>{chat.label}</b>
            </A>
          )}
        </div>
        <A href={logoHref} className={ink ? "tpf-word is-ink" : "tpf-word"} label={name}>
          {ink ? <InkWordmark text={brand} play={stage >= 3} /> : <span>{brand}</span>}
        </A>
      </div>

      {sideLinks?.map((l, i) => (
        <A
          key={l.href}
          href={l.href}
          className={"tpf-z tpf-side tpf-ink tpf-p " + (i ? "r" : "l")}
          label={l.label}
          style={{ ...H(1 + i), left: i ? "71.5%" : "29.5%" }}
        >
          <span>{l.label}</span>
          <Icon name={l.icon} />
        </A>
      ))}

      <div className="tpf-z tpf-foot tpf-ink">
        <span className="tpf-p" style={H(3)}>
          {copyright}
        </span>
        {credit && (
          <span className="tpf-credit tpf-p" style={H(4)}>
            {credit}
          </span>
        )}
        {handle && (
          <A href={handle.href} className="tpf-handle tpf-p" style={H(5)}>
            {handle.label}
          </A>
        )}
      </div>
    </footer>
  );
}
