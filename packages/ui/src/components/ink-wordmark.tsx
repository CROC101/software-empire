"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Ink wordmark: a giant word in dry-brush ink, stamped down letter by letter with a puff of
 * dust over a waterline that draws itself, then a crocodile's eyes surface behind one letter
 * and blink now and then. Letters wobble on hover. The ink texture is an SVG filter; colour
 * is `currentColor`, the eyes use the `--em-croc-*` / `--em-gold-*` tokens. Styles: `.iwm`
 * in styles.css. Lettering and stamp after "doodle-crew-footer" (21st.dev, MIT).
 */

const FONT_SIZE = 200;
const FONT =
  '"Arial Black", "Inter Display", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** A small deterministic hash in [0, 1), so every render lays the word out the same way. */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

type Metrics = { advances: number[]; cap: number };

const estimate = (chars: string[]): Metrics => ({
  advances: chars.map(
    (c) => (c === " " ? 0.3 : /[IJ1.]/.test(c) ? 0.42 : /[MW]/.test(c) ? 0.98 : 0.76) * FONT_SIZE,
  ),
  cap: 0.73 * FONT_SIZE,
});

const measure = (chars: string[], family: string): Metrics | null => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = `900 ${String(FONT_SIZE)}px ${family}`;
  const advances: number[] = [];
  let prev = 0;
  for (let i = 0; i < chars.length; i++) {
    const w = ctx.measureText(chars.slice(0, i + 1).join("")).width;
    advances.push(w - prev);
    prev = w;
  }
  const m = ctx.measureText("H");
  return {
    advances,
    cap: m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : 0.73 * FONT_SIZE,
  };
};

export function InkWordmark({
  text,
  play,
  peek,
  fontFamily = FONT,
  tracking = -0.02,
  className,
}: {
  /** Upper-cased, like a rubber stamp. */
  text: string;
  /** Starts the stamp; before that the letters wait unseen. */
  play: boolean;
  /** Index of the letter the crocodile hides behind; defaults to the first O. */
  peek?: number;
  fontFamily?: string;
  /** Letter spacing, in em. */
  tracking?: number;
  className?: string;
}) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chars = React.useMemo(() => Array.from(text.toUpperCase()), [text]);
  const [metrics, setMetrics] = React.useState(() => estimate(chars));

  // measure the real face, again once late web fonts land
  React.useLayoutEffect(() => {
    const run = () => {
      const m = measure(chars, fontFamily);
      if (m) setMetrics(m);
    };
    run();
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive) run();
    });
    return () => {
      alive = false;
    };
  }, [chars, fontFamily]);

  const gap = tracking * FONT_SIZE;
  const xs: number[] = [];
  let at = 0;
  for (const [i, a] of metrics.advances.entries()) {
    xs.push(at);
    at += Math.max(0, a) + (i < chars.length - 1 ? gap : 0);
  }
  const width = at;
  const cap = metrics.cap;
  const o = chars.indexOf("O");
  const croc = Math.min(chars.length - 1, Math.max(0, peek ?? (o >= 0 ? o : chars.length >> 1)));
  const crocX = (xs[croc] ?? 0) + (metrics.advances[croc] ?? 0) / 2;
  const stamp = (i: number) => 160 + i * 80; // ms; the waterline draws first, then left to right
  const crocAt = stamp(chars.length - 1) + 420;

  const pad = 24;
  const top = -cap - 80;
  const bottom = 34;
  const view = { x: -pad, y: top, w: width + pad * 2, h: bottom - top };

  // a hand-drawn waterline, slightly wobbly, and two ripples where the crocodile sits
  const water = React.useMemo(() => {
    const x0 = view.x + 6;
    const x1 = view.x + view.w - 6;
    const n = 14;
    let d = `M${x0.toFixed(1)} 10`;
    for (let k = 1; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const mid = x - (x1 - x0) / n / 2;
      d += ` Q${mid.toFixed(1)} ${(10 + (hash(k * 3.1) - 0.5) * 7).toFixed(1)} ${x.toFixed(1)} ${(10 + (hash(k * 7.7) - 0.5) * 2).toFixed(1)}`;
    }
    return d;
  }, [view.x, view.w]);

  const ms = (v: number) => `${String(v)}ms`;

  return (
    <svg
      className={cn("iwm", play && "is-play", className)}
      viewBox={`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`}
      style={{
        width: `${(view.w / FONT_SIZE).toFixed(3)}em`,
        height: `${(view.h / FONT_SIZE).toFixed(3)}em`,
      }}
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id={`${uid}-ink`} x="-4%" y="-6%" width="108%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="3"
            seed="11"
            result="edge"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="edge"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.32"
            numOctaves="2"
            seed="4"
            result="streak"
          />
          <feColorMatrix
            in="streak"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 5.6"
            result="streakA"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="1"
            seed="9"
            result="speck"
          />
          <feColorMatrix
            in="speck"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -24 7.0"
            result="speckA"
          />
          <feComposite
            in="streakA"
            in2="speckA"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="holes"
          />
          <feComposite in="rough" in2="holes" operator="out" />
        </filter>
      </defs>

      <path
        className="iwm-water"
        pathLength={1}
        d={water}
        style={{ "--d": "60ms" } as React.CSSProperties}
      />

      {/* the crocodile, behind its letter: only the eyes clear the top edge */}
      <g transform={`translate(${crocX.toFixed(1)} ${(-cap + 12).toFixed(1)}) scale(1.5)`}>
        <g className="iwm-croc" style={{ "--d": ms(crocAt) } as React.CSSProperties}>
          {[-22, 22].map((x) => (
            <g key={x}>
              <ellipse className="iwm-mound" cx={x} cy="-12" rx="24" ry="15" />
              <g className="iwm-eye">
                <ellipse className="iwm-iris" cx={x} cy="-17" rx="12" ry="7.5" />
                <ellipse className="iwm-ink" cx={x} cy="-17" rx="1.6" ry="6.8" />
                {/* the studio croc's glint: toward the moon, up and to the right */}
                <circle className="iwm-glint" cx={x + 4} cy="-20" r="2" />
              </g>
              <path
                className="iwm-lid"
                d={`M${String(x - 17)} -24 Q${String(x)} -38 ${String(x + 17)} -24`}
              />
            </g>
          ))}
        </g>
      </g>

      {chars.map((c, i) =>
        c === " " ? null : (
          <g
            key={i}
            className="iwm-letter"
            style={
              {
                "--d": ms(stamp(i)),
                "--r": `${((hash(i * 2.3) - 0.5) * 9).toFixed(2)}deg`,
              } as React.CSSProperties
            }
          >
            <g className="iwm-glyph">
              <text
                x={xs[i]}
                y={0}
                fontSize={FONT_SIZE}
                fontWeight={900}
                style={{ fontFamily }}
                filter={`url(#${uid}-ink)`}
              >
                {c}
              </text>
            </g>
            <path
              className="iwm-dust"
              d={`M${String((xs[i] ?? 0) - 6)} -6 l-16 -6 M${String((xs[i] ?? 0) - 4)} -16 l-12 -12 M${String((xs[i] ?? 0) + (metrics.advances[i] ?? 0) + 6)} -6 l16 -6 M${String((xs[i] ?? 0) + (metrics.advances[i] ?? 0) + 4)} -16 l12 -12`}
            />
          </g>
        ),
      )}
    </svg>
  );
}
