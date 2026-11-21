"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Broad bands of colour bend through slow curves like light through moving glass. */
export default function BendBands({ speed = 0.5, bands = 5 }: { speed?: number; bands?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-ink-975",
    "--em-blue-800",
    "--em-blue-500",
    "--em-sky-400",
    "--em-ink-100",
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
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const w = v + 0.25 * Math.sin(u * 2.2 + T) + 0.1 * Math.sin(u * 5 - T * 1.4);
                const n = 0.5 + 0.5 * Math.sin(w * bands * 2);
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
    [colors, speed, bands],
    { res: 0.2 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
