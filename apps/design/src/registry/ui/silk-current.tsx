"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Folds of cloth: stripes bent by two slow sines, lit brighter where the folds face the light. */
export default function SilkCurrent({
  speed = 0.5,
  folds = 3,
}: {
  speed?: number;
  folds?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-ink-975",
    "--em-blue-800",
    "--em-blue-400",
    "--em-blue-200",
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
            const f = 0.012 / s.k;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y * f;
              for (let x = 0; x < s.pw; x++) {
                const u = x * f;
                const w = v + Math.sin(u * 0.8 + T) * 0.9 + Math.sin(u * 0.3 - T * 0.5) * 1.6;
                const band = Math.sin(w * folds) * 0.5 + 0.5;
                const light = 0.55 + 0.45 * Math.sin(u * 0.5 + v * 0.2 + T * 0.3);
                const i = (band * band * light * 255) | 0;
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
    [colors, speed, folds],
    { res: 0.2 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
