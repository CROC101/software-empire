"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";

/**
 * Phosphor 404: a CRT tube lit as round phosphor dots with a soft bloom. An extruded error code
 * ringed by twinkling sparkles, a message between diamonds, and a crocodile peeking out of
 * rolling water. Click the screen to change the channel (with a burst of static), the pointer
 * leaves a phosphor trail, the power switch collapses the picture to a line.
 *
 * Our own build after "Retro CRT 404 Page" (21st.dev). Light: everything that stands still is
 * drawn once into a cached layer; each frame only draws the few moving dots, at most 30 fps,
 * and nothing runs while the set is off or the tab is hidden.
 */

type Sprite = string[]; // "X" lit, "o" dim, anything else off

const SPARKLE: Sprite = ["..X..", "..X..", "XXoXX", "..X..", "..X.."];
const CROC: Sprite = [
  "....XXX..........XXX...................",
  "...XoXoX........XoXoX..................",
  "..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...",
  ".XX..............................XXXX..",
  "XX.o.o.o.o.o.o.o.o.o.o.o.o.o.o.o..XXXX.",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];

type Lit = { x: number; y: number; a: number };

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

export function PhosphorNotFound({
  code = "404",
  title = "PAGE NOT FOUND",
  channels = ["SIGNAL LOST", "NO CARRIER", "LOST IN THE SWAMP", "TRY ANOTHER LINK"],
  homeHref = "/",
  homeLabel = "TAKE ME HOME",
  caption,
  hint = "click the screen to change the channel",
  powerLabel = "Power",
  className,
}: {
  code?: string;
  title?: string;
  /** Messages the channel button cycles through (short, Latin caps read best as dots). */
  channels?: string[];
  homeHref?: string;
  homeLabel?: string;
  /** A plain-text line under the tube, for readers and screen readers. */
  caption?: React.ReactNode;
  hint?: string;
  powerLabel?: string;
  className?: string;
}) {
  const screenRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const homeRef = React.useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const colors = useTokenColors(["--em-sky-500", "--em-blue-500", "--em-ink-975"]);
  const [channel, setChannel] = React.useState(0);
  const [on, setOn] = React.useState(true);

  const [st] = React.useState(() => ({
    cell: 7,
    cols: 0,
    rows: 0,
    W: 0,
    H: 0,
    dpr: 1,
    staticLayer: null as HTMLCanvasElement | null,
    sparkles: [] as { x: number; y: number; phase: number }[],
    croc: { x: 0, y: 0, k: 1 },
    waterY: 0,
    trail: [] as { x: number; y: number; t: number }[],
    noiseUntil: 0,
    raf: 0,
    last: 0,
    visible: true,
  }));

  /** Rasterise text and shapes into a cols x rows mask, then light a dot per lit cell. */
  const buildStatic = React.useCallback(() => {
    const { cols, rows, cell } = st;
    if (!cols || !rows || !colors) return;
    const [phosphor = "#38bdf8", , ink = "#05070d"] = colors;
    const mask = document.createElement("canvas");
    mask.width = cols;
    mask.height = rows;
    const m = mask.getContext("2d", { willReadFrequently: true });
    if (!m) return;
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    m.textAlign = "center";
    m.textBaseline = "middle";
    /** Fit `text` to at most `h` rows tall and 90% of the width, centred at row `y`. */
    const fit = (text: string, y: number, h: number, weight = 900, shade = 255, dx = 0, dy = 0) => {
      // small lines read better as dots in a mono face; the big code keeps the display face
      const face = h < rows * 0.15 ? "ui-monospace, Menlo, Consolas, monospace" : family;
      m.font = `${String(weight)} 100px ${face}`;
      const w = m.measureText(text).width || 1;
      const size = Math.max(5, Math.min(h * 1.25, ((cols * 0.9) / w) * 100));
      m.font = `${String(weight)} ${String(size)}px ${face}`;
      m.fillStyle = `rgb(${String(shade)},0,0)`;
      m.fillText(text, cols / 2 + dx, y + dy);
      return { size, width: (w * size) / 100 };
    };
    fit(`== ${title} ==`, rows * 0.12, rows * 0.08, 700);
    // the code, extruded: dim layers stepped down-right, the face on top
    for (let i = 4; i > 0; i--) fit(code, rows * 0.36, rows * 0.3, 900, 110, i * 0.6, i * 0.6);
    fit(code, rows * 0.36, rows * 0.3, 900, 255);
    fit(`◆ ${channels[channel % channels.length] ?? ""} ◆`, rows * 0.6, rows * 0.08, 700);
    const home = fit(homeLabel, rows * 0.71, rows * 0.07, 700);

    // position the real link over the dotted label, so it is clickable and focusable
    if (homeRef.current) {
      const hw = home.width * cell;
      const hh = home.size * cell;
      Object.assign(homeRef.current.style, {
        left: `${String((st.W - hw) / 2)}px`,
        top: `${String(rows * 0.71 * cell - hh / 2)}px`,
        width: `${String(hw)}px`,
        height: `${String(hh)}px`,
      });
    }

    const data = m.getImageData(0, 0, cols, rows).data;
    const layer = document.createElement("canvas");
    layer.width = Math.round(st.W * st.dpr);
    layer.height = Math.round(st.H * st.dpr);
    const g = layer.getContext("2d");
    if (!g) return;
    g.scale(st.dpr, st.dpr);
    g.fillStyle = ink;
    g.fillRect(0, 0, st.W, st.H);
    const lit: Lit[] = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const v = data[(y * cols + x) * 4] ?? 0;
        lit.push({ x, y, a: v > 160 ? 1 : v > 60 ? 0.45 : 0.06 }); // unlit dots still glow faintly
      }
    const dots = (alpha: number) => {
      g.fillStyle = phosphor;
      for (const d of lit) {
        g.globalAlpha = d.a * alpha;
        g.beginPath();
        g.arc(d.x * cell + cell / 2, d.y * cell + cell / 2, cell * 0.38, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    };
    dots(1);
    // bloom: the same dots again, blurred and added (skipped where ctx.filter is unsupported)
    if ("filter" in g) {
      g.filter = `blur(${String(cell * 0.9)}px)`;
      g.globalCompositeOperation = "lighter";
      dots(0.55);
      g.filter = "none";
      g.globalCompositeOperation = "source-over";
    }
    st.staticLayer = layer;

    // where the moving parts live, in cells
    st.sparkles = [
      { x: cols * 0.18, y: rows * 0.26, phase: 0 },
      { x: cols * 0.8, y: rows * 0.24, phase: 1.7 },
      { x: cols * 0.14, y: rows * 0.46, phase: 3.1 },
      { x: cols * 0.84, y: rows * 0.47, phase: 4.4 },
    ];
    // the croc doubles in size only where the tube is wide enough to hold it
    const k = cols > 110 ? 2 : 1;
    st.croc = {
      x: Math.round(cols / 2 - ((CROC[0]?.length ?? 0) * k) / 2),
      y: Math.round(rows * 0.78),
      k,
    };
    st.waterY = st.croc.y + 4 * k + 1;
  }, [st, colors, code, title, channels, channel, homeLabel]);

  const frame = React.useCallback(
    (now: number) => {
      st.raf = 0;
      const canvas = canvasRef.current;
      const g = canvas?.getContext("2d");
      if (!canvas || !g || !st.staticLayer || !colors) return;
      if (now - st.last < 32 && !reduced) {
        // 30 fps is plenty for phosphor
        st.raf = requestAnimationFrame(frame);
        return;
      }
      st.last = now;
      const { cell, cols, rows } = st;
      const [phosphor = "#38bdf8", accent = "#3b82f6"] = colors;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(st.staticLayer, 0, 0);
      g.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      const t = reduced ? 0 : now / 1000;
      const dot = (x: number, y: number, a: number, color = phosphor) => {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return;
        g.globalAlpha = a;
        g.fillStyle = color;
        g.beginPath();
        g.arc(
          Math.round(x) * cell + cell / 2,
          Math.round(y) * cell + cell / 2,
          cell * 0.4,
          0,
          Math.PI * 2,
        );
        g.fill();
      };
      const sprite = (s: Sprite, ox: number, oy: number, a: number, k = 1) =>
        s.forEach((row, y) => {
          // sprites are plain ASCII, so indexing by char is safe; k scales one sprite pixel to k×k dots
          for (let x = 0; x < row.length; x++) {
            const c = row.charAt(x);
            if (c !== "X" && c !== "o") continue;
            for (let i = 0; i < k * k; i++)
              dot(ox + x * k + (i % k), oy + y * k + Math.floor(i / k), c === "X" ? a : a * 0.45);
          }
        });

      for (const s of st.sparkles) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 2.2 + s.phase);
        sprite(SPARKLE, s.x - 2, s.y - 2 + Math.sin(t * 1.4 + s.phase) * 1.5, twinkle);
      }
      // the croc bobs, the water rolls past it
      const bob = Math.round(Math.sin(t * 1.1) * 1);
      sprite(CROC, st.croc.x, st.croc.y + bob, 1, st.croc.k);
      for (let r = 0; r < 3; r++) {
        const y = st.waterY + r * 2;
        for (let x = 0; x < cols; x++) {
          const wave = Math.sin(x * 0.35 - t * (2 - r * 0.4) + r);
          if (wave > 0.2) dot(x, y + (wave > 0.85 ? -1 : 0), 0.5 - r * 0.12, accent);
        }
      }
      // pointer trail
      st.trail = st.trail.filter((p) => now - p.t < 600);
      for (const p of st.trail) dot(p.x, p.y, 1 - (now - p.t) / 600);
      // channel static
      if (now < st.noiseUntil) {
        for (let i = 0; i < cols * rows * 0.12; i++)
          dot(Math.random() * cols, Math.random() * rows, Math.random() * 0.8);
      }
      g.globalAlpha = 1;
      if (!reduced || now < st.noiseUntil || st.trail.length) st.raf = requestAnimationFrame(frame);
    },
    [st, colors, reduced],
  );

  const wake = React.useCallback(() => {
    if (!st.raf && st.visible) st.raf = requestAnimationFrame(frame);
  }, [st, frame]);

  // size the grid to the screen
  React.useEffect(() => {
    const el = screenRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      st.W = r.width;
      st.H = r.height;
      st.dpr = Math.min(2, window.devicePixelRatio || 1);
      st.cell = Math.max(5, Math.round(Math.min(r.width, r.height * 1.6) / 160));
      st.cols = Math.floor(r.width / st.cell);
      st.rows = Math.floor(r.height / st.cell);
      canvas.width = Math.round(r.width * st.dpr);
      canvas.height = Math.round(r.height * st.dpr);
      buildStatic();
      wake();
    });
    ro.observe(el);
    const onVis = () => {
      st.visible = document.visibilityState === "visible";
      wake();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [st, buildStatic, wake]);

  // rebuild when the channel or the colours change
  React.useEffect(() => {
    buildStatic();
    wake();
  }, [buildStatic, wake]);

  React.useEffect(() => {
    if (on) wake();
    else {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    }
  }, [on, st, wake]);

  const zap = () => {
    if (!on) return;
    st.noiseUntil = performance.now() + 260;
    setChannel((c) => c + 1);
    wake();
  };

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-5 bg-[var(--em-ink-975)] p-4 sm:p-8",
        className,
      )}
    >
      <div className="relative w-full max-w-5xl">
        <div
          ref={screenRef}
          data-on={on || undefined}
          className="em-crt relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] sm:aspect-[16/10]"
          onClick={zap}
          onPointerMove={(e) => {
            if (!on || reduced) return;
            const r = e.currentTarget.getBoundingClientRect();
            st.trail.push({
              x: (e.clientX - r.left) / st.cell,
              y: (e.clientY - r.top) / st.cell,
              t: performance.now(),
            });
            wake();
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden
            className="em-crt__picture absolute inset-0 size-full"
          />
          <a
            ref={homeRef}
            href={homeHref}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-10 text-transparent focus-visible:outline-2 focus-visible:outline-[var(--em-sky-500)]"
          >
            {homeLabel}
          </a>
          <span aria-hidden className="em-crt__glass pointer-events-none absolute inset-0" />
          <p className="pointer-events-none absolute right-5 top-4 hidden font-mono sm:block text-[10px] uppercase tracking-[0.3em] text-[var(--em-sky-500)]/60">
            {hint}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
          className="absolute -bottom-3 right-6 inline-flex items-center gap-2 border border-[var(--em-ink-700)] bg-[var(--em-ink-950)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--em-ink-300)]"
        >
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              on
                ? "bg-[var(--em-sky-500)] shadow-[0_0_8px_var(--em-sky-500)]"
                : "bg-[var(--em-ink-700)]",
            )}
          />
          {powerLabel}
        </button>
      </div>
      <h1 className="sr-only">
        {code} {title}
      </h1>
      {caption && (
        <div className="max-w-xl text-center text-sm text-[var(--em-ink-300)]">{caption}</div>
      )}
    </div>
  );
}
