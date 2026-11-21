"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Rings of dots turn in alternate directions on a tilted plane; the pointer changes the tilt. */
export default function HaloRings({ speed = 1, rings = 5 }: { speed?: number; rings?: number }) {
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
            const tilt = s.pointer.on ? 0.15 + (s.pointer.y / s.h) * 0.7 : 0.5;
            const R = Math.min(s.w, s.h * 2) * 0.45;
            for (let k = 0; k < rings; k++) {
              const r = R * ((k + 1) / rings);
              const dots = 12 + k * 8;
              const spin = (T * (k % 2 === 0 ? 0.4 : -0.3)) / (k + 1);
              for (let j = 0; j < dots; j++) {
                const a = (j / dots) * Math.PI * 2 + spin;
                const z = Math.sin(a);
                const size = 1.5 + (z + 1) * 1.2;
                ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * z);
                ctx.fillStyle = z > 0.6 ? c1 : c0;
                ctx.fillRect(
                  s.w / 2 + Math.cos(a) * r - size / 2,
                  s.h / 2 + z * r * tilt - size / 2,
                  size,
                  size,
                );
              }
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, rings],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
