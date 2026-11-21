"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Five blobs of molten metal drift and merge; where they join the surface shows banded chrome reflections. */
export default function MoltenPool({ speed = 0.5 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-ink-975",
    "--em-blue-900",
    "--em-ink-300",
    "--em-ink-0",
    "--em-sky-400",
  ]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        let img = ctx.createImageData(1, 1);
        return {
          resize: () => {
            img = ctx.createImageData(s.pw, s.ph);
          },
          draw: (t) => {
            const d = img.data;
            const T = t * speed;
            const A = s.pw / s.ph;
            const balls = [0, 1, 2, 3, 4].map((k) => ({
              x: A / 2 + Math.sin(T * (0.5 + k * 0.13) + k * 2) * A * 0.3,
              y: 0.5 + Math.cos(T * (0.4 + k * 0.11) + k) * 0.3,
            }));
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                let f = 0;
                for (const b of balls) f += 0.012 / ((u - b.x) ** 2 + (v - b.y) ** 2 + 0.0001);
                const n = f < 1 ? f * 0.25 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(f * 1.5 + v * 6));
                const i = (Math.max(0, Math.min(1, n)) * 255) | 0;
                d[o] = ramp[i * 3] ?? 0;
                d[o + 1] = ramp[i * 3 + 1] ?? 0;
                d[o + 2] = ramp[i * 3 + 2] ?? 0;
                d[o + 3] = 255;
                o += 4;
              }
            }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, speed],
    { res: 0.2 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
