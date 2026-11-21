"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A grid of squares that grow, shrink and turn in rings spreading out from the centre. */
export default function SpinTiles({ speed = 1, cell = 40 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-800", "--em-blue-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            for (let y = cell / 2; y < s.h + cell; y += cell)
              for (let x = cell / 2; x < s.w + cell; x += cell) {
                const k = Math.sin(Math.hypot(x - s.w / 2, y - s.h / 2) * 0.02 - T * 2);
                const z = cell * (0.3 + 0.35 * (k + 1));
                ctx.setTransform(s.k, 0, 0, s.k, x * s.k, y * s.k);
                ctx.rotate(k * 1.2);
                ctx.fillStyle = k > 0.5 ? c2 : k > -0.2 ? c1 : c0;
                ctx.fillRect(-z / 2, -z / 2, z, z);
              }
            ctx.setTransform(s.k, 0, 0, s.k, 0, 0);
          },
        };
      }),
    [colors, speed, cell],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
