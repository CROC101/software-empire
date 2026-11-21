"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Polygon outlines grow out of the centre one after another, turning a little and fading as they go. */
export default function ShapePulse({ speed = 0.5, sides = 6 }: { speed?: number; sides?: number }) {
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
            const R = Math.hypot(s.w, s.h) / 2;
            ctx.lineWidth = 2;
            for (let k = 0; k < 9; k++) {
              const f = (T * 0.3 + k / 9) % 1;
              const r = f * R;
              ctx.strokeStyle = k % 2 === 1 ? c1 : c0;
              ctx.globalAlpha = 1 - f;
              ctx.beginPath();
              for (let j = 0; j <= sides; j++) {
                const a = (j / sides) * Math.PI * 2 + f * 1.2;
                const x = s.w / 2 + Math.cos(a) * r;
                const y = s.h / 2 + Math.sin(a) * r;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, sides],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
