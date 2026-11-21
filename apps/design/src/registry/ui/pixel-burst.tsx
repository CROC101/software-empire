"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A grid of pixels; a tap sends a ring of light out through them, and a ring goes off by itself now and then. */
export default function PixelBurst({ speed = 1, cell = 10 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-700", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        const bursts: { x: number; y: number; t: number }[] = [];
        return {
          draw: (t) => {
            const T = t * speed;
            if (s.pointer.down === 0) bursts.push({ x: s.pointer.x, y: s.pointer.y, t: T });
            const last = bursts[bursts.length - 1];
            if (last === undefined || T - last.t > 1.8)
              bursts.push({
                x: (0.2 + 0.3 * (1 + Math.sin(T * 3.1))) * s.w,
                y: (0.2 + 0.3 * (1 + Math.cos(T * 2.3))) * s.h,
                t: T,
              });
            while (bursts.length > 6) bursts.shift();
            ctx.clearRect(0, 0, s.w, s.h);
            for (let y = cell / 2; y < s.h; y += cell)
              for (let x = cell / 2; x < s.w; x += cell) {
                let e = 0;
                for (const b of bursts) {
                  const age = T - b.t;
                  const ring = Math.abs(Math.hypot(x - b.x, y - b.y) - age * 220);
                  e += Math.max(0, 1 - ring / 24) * Math.max(0, 1 - age / 2);
                }
                ctx.globalAlpha = 0.12 + Math.min(1, e) * 0.88;
                ctx.fillStyle = e > 0.5 ? c1 : c0;
                ctx.fillRect(x - cell * 0.35, y - cell * 0.35, cell * 0.7, cell * 0.7);
              }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, cell],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label="ตารางพิกเซล แตะเพื่อปล่อยวงแสง"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
