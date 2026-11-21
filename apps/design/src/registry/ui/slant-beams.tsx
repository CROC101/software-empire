"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Tilted columns of light drift sideways and swell, each with a brighter core. */
export default function SlantBeams({ speed = 0.5, beams = 7 }: { speed?: number; beams?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.setTransform(s.k, 0, 0, s.k, (s.w * s.k) / 2, (s.h * s.k) / 2);
            ctx.rotate(-0.5);
            const L = Math.hypot(s.w, s.h);
            for (let k = 0; k < beams; k++) {
              const x = ((k + 0.5) / beams - 0.5) * L + Math.sin(T + k * 1.7) * 30;
              const w = 18 + 14 * (0.5 + 0.5 * Math.sin(T * 0.8 + k));
              const a = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(T * 1.2 + k * 2.3));
              ctx.fillStyle = k % 2 === 0 ? c0 : c1;
              ctx.globalAlpha = a;
              ctx.fillRect(x - w / 2, -L / 2, w, L);
              ctx.globalAlpha = a * 1.8;
              ctx.fillRect(x - 1, -L / 2, 2, L);
            }
            ctx.setTransform(s.k, 0, 0, s.k, 0, 0);
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, beams],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
