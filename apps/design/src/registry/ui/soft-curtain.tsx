"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A soft curtain of light hangs across the sky, its folds shimmering and drifting sideways. */
export default function SoftCurtain({ speed = 0.4 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-975", "--em-blue-900", "--em-blue-500", "--em-sky-400"]);
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
                const band = Math.exp(-(((v - 0.4 - 0.12 * Math.sin(u * 2.5 + T)) * 5) ** 2));
                const n =
                  band * (0.55 + 0.45 * Math.sin(u * 9 + Math.sin(u * 3 - T) * 2 + T * 1.5));
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
    { res: 0.15 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
