"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { animate, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const END = Date.UTC(2026, 10, 20); // fixed so server and client draw the same days
const DAY = 86_400_000;
const levels = ["--em-ink-200", "--em-blue-200", "--em-blue-400", "--em-blue-600", "--em-blue-800"];

/** A made-up but steady activity history: busier mid-week, quiet weekends, a few streaks. */
function sample(weeks: number) {
  const days: { date: number; n: number }[] = [];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const start = END - (weeks * 7 - 1) * DAY;
  for (let k = 0; k < weeks * 7; k++) {
    const date = start + k * DAY;
    const wd = new Date(date).getUTCDay();
    const busy = wd === 0 || wd === 6 ? 0.25 : 0.75;
    const wave = 0.5 + 0.5 * Math.sin(k / 9);
    days.push({
      date,
      n: rnd() < busy * (0.4 + wave * 0.6) ? Math.round(rnd() * 12 * wave + 1) : 0,
    });
  }
  return days;
}

const ISO = { xx: 0.86, xy: 0.3, yx: -0.42, yy: 0.36 }; // world x / y axes on screen

/**
 * An activity heatmap that stands up into a skyline: the flat grid of days rises into 3D bars
 * whose height is the count, the first time it comes into view. The toggle morphs between the
 * two; pointing at a day names its date and count.
 */
export default function ContributionSkyline({ weeks = 26 }: { weeks?: number }) {
  const still = useReducedMotionAfterMount();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const t = useRef(0);
  const run = useRef<{ stop: () => void } | null>(null);
  const quads = useRef<Float32Array>(new Float32Array(0));
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [hover, setHover] = useState<{ k: number; x: number; y: number } | null>(null);
  const seen = useInView(wrap, { once: true, amount: 0.5 });
  const days = useMemo(() => sample(weeks), [weeks]);
  const max = Math.max(1, ...days.map((d) => d.n));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));

  const draw = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const css = getComputedStyle(c);
    const fill = levels.map((v) => css.getPropertyValue(v).trim());
    const shade = css.getPropertyValue("--em-ink-975").trim();
    const W = c.clientWidth;
    const H = c.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const tt = t.current;
    const tall = 3.2;
    // fit both layouts to the box, then blend between them
    const fit = (w: number, h: number, ox: number, oy: number) => {
      const s = Math.min((W - 16) / w, (H - 16) / h);
      return { s, dx: (W - w * s) / 2 - ox * s, dy: (H - h * s) / 2 - oy * s };
    };
    const flat = fit(weeks, 7, 0, 0);
    const isoMinX = 7 * ISO.yx;
    const iso = fit(weeks * ISO.xx - isoMinX, weeks * ISO.xy + 7 * ISO.yy + tall, isoMinX, -tall);
    const at = (x: number, y: number, z: number): [number, number] => {
      const fx = x * flat.s + flat.dx;
      const fy = y * flat.s + flat.dy;
      const ix = (x * ISO.xx + y * ISO.yx) * iso.s + iso.dx;
      const iy = (x * ISO.xy + y * ISO.yy - z * tt) * iso.s + iso.dy;
      return [fx + (ix - fx) * tt, fy + (iy - fy) * tt];
    };
    const poly = (pts: [number, number][], color: string, dark = 0) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      if (dark) {
        ctx.globalAlpha = dark;
        ctx.fillStyle = shade;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const q = new Float32Array(days.length * 8);
    // back to front: smaller x + y first
    const order = days
      .map((_, k) => k)
      .sort((a, b) => {
        const sa = Math.floor(a / 7) + (a % 7);
        const sb = Math.floor(b / 7) + (b % 7);
        return sa - sb;
      });
    for (const k of order) {
      const d = days[k];
      if (!d) continue;
      const x0 = Math.floor(k / 7) + 0.1;
      const y0 = (k % 7) + 0.1;
      const x1 = x0 + 0.8;
      const y1 = y0 + 0.8;
      const z = d.n ? 0.15 + (d.n / max) * tall : 0.05;
      const col = fill[level(d.n)] ?? "";
      const top = [at(x0, y0, z), at(x1, y0, z), at(x1, y1, z), at(x0, y1, z)];
      if (tt > 0.01) {
        poly([at(x1, y0, z), at(x1, y1, z), at(x1, y1, 0), at(x1, y0, 0)], col, 0.28);
        poly([at(x0, y1, z), at(x1, y1, z), at(x1, y1, 0), at(x0, y1, 0)], col, 0.14);
      }
      poly(top, col);
      top.forEach(([x, y], i) => {
        q[k * 8 + i * 2] = x;
        q[k * 8 + i * 2 + 1] = y;
      });
    }
    quads.current = q;
  };

  const go = (to: "2d" | "3d") => {
    setView(to);
    const target = to === "3d" ? 1 : 0;
    if (still) {
      t.current = target;
      draw();
      return;
    }
    run.current?.stop();
    run.current = animate(t.current, target, {
      duration: 1.2,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        t.current = v;
        draw();
      },
    });
  };

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => {
      draw();
    });
    if (canvas.current) ro.observe(canvas.current);
    return () => {
      ro.disconnect();
    };
  });

  useEffect(() => {
    if (!seen) return;
    // rise once, the first time the chart is seen (next frame, so the flat grid paints first)
    const f = requestAnimationFrame(() => {
      go("3d");
    });
    return () => {
      cancelAnimationFrame(f);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const q = quads.current;
    // the front-most quad wins: walk from the front of the drawing order
    let best = -1;
    let bestDepth = -1;
    for (let k = 0; k < days.length; k++) {
      let inside = true;
      let sign = 0;
      for (let i = 0; i < 4 && inside; i++) {
        const ax = q[k * 8 + i * 2] ?? 0;
        const ay = q[k * 8 + i * 2 + 1] ?? 0;
        const bx = q[k * 8 + ((i + 1) % 4) * 2] ?? 0;
        const by = q[k * 8 + ((i + 1) % 4) * 2 + 1] ?? 0;
        const cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
        if (cr !== 0) {
          if (sign === 0) sign = Math.sign(cr);
          else if (Math.sign(cr) !== sign) inside = false;
        }
      }
      const depth = Math.floor(k / 7) + (k % 7);
      if (inside && depth > bestDepth) {
        best = k;
        bestDepth = depth;
      }
    }
    setHover(best < 0 ? null : { k: best, x, y });
  };

  const total = days.reduce((a, d) => a + d.n, 0);
  let streak = 0;
  let len = 0;
  for (const d of days) {
    len = d.n ? len + 1 : 0;
    streak = Math.max(streak, len);
  }
  const best = days.reduce((a, d) => (d.n > a.n ? d : a), { date: END, n: 0 });
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });
  const h = hover ? days[hover.k] : null;

  return (
    <section className="@container relative isolate grid size-full min-h-[34rem] content-center gap-5 overflow-clip bg-(--em-ink-50) px-6 py-10 text-(--em-ink-950)">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            Activity
          </p>
          <h2 className="mt-2 font-heading text-3xl leading-none font-black @2xl:text-5xl">
            <span className="tabular-nums">{total.toLocaleString("th-TH")}</span> คอมมิตใน {weeks}{" "}
            สัปดาห์
          </h2>
        </div>
        <div className="flex rounded-md border border-(--em-ink-200) bg-(--em-ink-0) p-1">
          {(["2d", "3d"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => {
                go(v);
              }}
              className={cn(
                "h-9 rounded-sm px-4 font-mono text-sm uppercase",
                view === v ? "bg-(--em-ink-950) text-(--em-ink-0)" : "hover:bg-(--em-ink-100)",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrap} className="relative mx-auto aspect-[2/1] w-full max-w-5xl">
        <canvas
          ref={canvas}
          role="img"
          aria-label={`กราฟกิจกรรม ${String(total)} คอมมิต สูงสุดวันละ ${String(max)}`}
          onPointerMove={pick}
          onPointerLeave={() => {
            setHover(null);
          }}
          className="size-full"
        />
        {h && hover && (
          <p
            style={{ transform: `translate(${String(hover.x)}px, ${String(hover.y - 44)}px)` }}
            className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 rounded-md bg-(--em-ink-950) px-2.5 py-1 text-xs whitespace-nowrap text-(--em-ink-0) shadow-md"
          >
            {fmt(h.date)} · <span className="tabular-nums">{h.n}</span> คอมมิต
          </p>
        )}
      </div>

      <dl className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-4 text-sm">
        {[
          ["รวม", total.toLocaleString("th-TH")],
          ["ติดกันนานสุด", `${String(streak)} วัน`],
          ["วันที่หนักสุด", `${fmt(best.date)} · ${String(best.n)}`],
        ].map(([k, v]) => (
          <div key={k} className="border-t border-(--em-ink-200) pt-2">
            <dt className="text-(--em-ink-500)">{k}</dt>
            <dd className="font-heading text-lg font-black tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
