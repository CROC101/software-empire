"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Seg = [number, number, number, number];

/** Split a line again and again, nudging each midpoint sideways, and branch now and then. */
function bolt(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  spread: number,
  depth: number,
  out: Seg[],
) {
  if (depth === 0) {
    out.push([x0, y0, x1, y1]);
    return;
  }
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * spread;
  const my = (y0 + y1) / 2 + (Math.random() - 0.5) * spread * 0.3;
  bolt(x0, y0, mx, my, spread / 2, depth - 1, out);
  bolt(mx, my, x1, y1, spread / 2, depth - 1, out);
  if (depth > 3 && Math.random() < 0.3)
    bolt(
      mx,
      my,
      mx + (Math.random() - 0.5) * spread * 1.5,
      my + spread,
      spread / 2,
      depth - 2,
      out,
    );
}

/** A lightning bolt that strikes, flickers and fades, then strikes again somewhere else; tap to call one. */
export default function BoltStrike({ every = 1.6 }: { every?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-ink-0", "--em-blue-900"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [glow = "#fff", core = "#fff", sky = "#000"] = colors;
        let segs: Seg[] = [];
        let at = -99;
        const strike = (t: number, x = s.w * (0.2 + Math.random() * 0.6)) => {
          segs = [];
          bolt(x, 0, x + (Math.random() - 0.5) * s.w * 0.3, s.h, s.h * 0.35, 7, segs);
          at = t;
        };
        const stroke = (width: number, color: string) => {
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          ctx.beginPath();
          for (const [a, b, c, d] of segs) {
            ctx.moveTo(a, b);
            ctx.lineTo(c, d);
          }
          ctx.stroke();
        };
        return {
          draw: (t) => {
            if (s.pointer.down === 0) strike(t, s.pointer.x);
            else if (t - at > every || !segs.length) strike(t);
            const age = t - at;
            const flicker =
              age < 0.25
                ? Math.sin(age * 90) > -0.3
                  ? 1
                  : 0.35
                : Math.max(0, 1 - (age - 0.25) * 2);
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.globalAlpha = flicker * 0.35;
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, s.w, s.h);
            ctx.lineCap = "round";
            ctx.globalAlpha = flicker * 0.35;
            stroke(6, glow);
            ctx.globalAlpha = flicker;
            stroke(1.5, core);
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, every],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
