"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** An old tube screen: curved scanlines, darker corners and a bright band that rolls down now and then. */
export default function TubeScreen({ speed = 1 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-900", "--em-blue-600", "--em-sky-400"]);
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
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              const cy = v - 0.5;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const cx = u - A / 2;
                const r2 = cx * cx + cy * cy;
                const wy = cy * (1 + r2 * 0.6) + 0.5;
                const scan = 0.75 + 0.25 * Math.sin(wy * 120);
                const roll = Math.exp(-(((wy - ((T * 0.15) % 1.4) + 0.2) * 8) ** 2));
                const base = 0.35 + 0.15 * Math.sin(cx * 6 + T) * Math.sin(wy * 5 - T * 0.6);
                const n = (base * scan + roll * 0.4) * (1 - r2 * 1.1);
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
    { res: 0.3 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
