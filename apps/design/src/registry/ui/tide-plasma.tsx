"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Four slow sine fields added together and coloured through the water ramp, drawn at a fifth of the size. */
export default function TidePlasma({ speed = 0.6, zoom = 1 }: { speed?: number; zoom?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-800", "--em-blue-500", "--em-sky-400"]);
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
            const f = 0.018 / zoom / s.k;
            const cx = s.pw * f * (0.5 + 0.3 * Math.sin(T * 0.4));
            const cy = s.ph * f * (0.5 + 0.3 * Math.cos(T * 0.3));
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y * f;
              for (let x = 0; x < s.pw; x++) {
                const u = x * f;
                const n =
                  Math.sin(u + T) +
                  Math.sin(v * 1.3 - T * 0.8) +
                  Math.sin((u + v) * 0.7 + T * 0.6) +
                  Math.sin(Math.hypot(u - cx, v - cy) * 1.4 - T);
                const i = ((n + 4) * 31.8) | 0;
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
    [colors, speed, zoom],
    { res: 0.2 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
