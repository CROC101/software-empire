"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** The sheen on a film of oil: bands of colour slide over each other and bend around the pointer. */
export default function OilSheen({ speed = 0.5 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-blue-900",
    "--em-blue-500",
    "--em-sky-400",
    "--em-ink-100",
    "--em-blue-700",
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
            const px = s.pointer.on ? s.pointer.x / s.h : A / 2;
            const py = s.pointer.on ? s.pointer.y / s.h : 0.5;
            let o = 0;
            for (let y = 0; y < s.ph; y++) {
              const v = y / s.ph;
              for (let x = 0; x < s.pw; x++) {
                const u = x / s.ph;
                const m = Math.exp(-((u - px) ** 2 + (v - py) ** 2) * 4) * 0.8;
                const n =
                  0.5 +
                  0.5 *
                    Math.sin(
                      u * 7 + Math.sin(v * 5 + T) * 2.2 + Math.cos(u * 3 - T * 0.7) + m * 3 + T,
                    );
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
    { res: 0.2, pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
