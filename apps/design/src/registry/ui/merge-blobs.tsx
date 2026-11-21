"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * Soft balls drift and melt into each other when they meet; one of them rides the pointer. Each
 * pixel sums every ball's pull and is coloured once the sum crosses the surface.
 */
export default function MergeBlobs({ count = 6, size = 60 }: { count?: number; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-800", "--em-blue-500", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        let img = ctx.createImageData(1, 1);
        const seeds = Array.from({ length: count }, (_, i) => ({ a: i * 2.4, b: i * 1.3 + 1 }));
        let mx = 0.5;
        let my = 0.5;
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const balls = seeds.map(({ a, b }) => [
              s.pw * (0.5 + 0.38 * Math.sin(t * 0.4 + a)),
              s.ph * (0.5 + 0.38 * Math.cos(t * 0.33 + b)),
            ]);
            if (s.pointer.on) {
              mx += (s.pointer.x / s.w - mx) * 0.2;
              my += (s.pointer.y / s.h - my) * 0.2;
              balls.push([mx * s.pw, my * s.ph]);
            }
            const r2 = (size * s.k) ** 2;
            const d = img.data;
            for (let y = 0; y < s.ph; y++)
              for (let x = 0; x < s.pw; x++) {
                let f = 0;
                for (const [bx = 0, by = 0] of balls) f += r2 / ((x - bx) ** 2 + (y - by) ** 2 + 1);
                const o = (y * s.pw + x) * 4;
                if (f < 1) {
                  d[o + 3] = 0;
                  continue;
                }
                const c = Math.min(255, Math.floor((f - 1) * 120)) * 3;
                d[o] = ramp[c] ?? 0;
                d[o + 1] = ramp[c + 1] ?? 0;
                d[o + 2] = ramp[c + 2] ?? 0;
                d[o + 3] = 255;
              }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, count, size],
    { pointer: true, res: 0.25 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
