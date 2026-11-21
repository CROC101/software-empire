"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Wedges of light burst from the centre and turn slowly, each widening and dimming on its own beat. */
export default function SpokeBurst({
  speed = 0.5,
  spokes = 24,
}: {
  speed?: number;
  spokes?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-600", "--em-sky-400", "--em-ink-100"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const L = Math.hypot(s.w, s.h);
            const tones = [c0, c1, c2];
            for (let k = 0; k < spokes; k++) {
              const a = (k / spokes) * Math.PI * 2 + T * 0.3;
              const w = (Math.PI / spokes) * (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(T * 2 + k * 1.3)));
              ctx.globalAlpha = 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(T * 1.7 + k));
              ctx.fillStyle = tones[k % 3] ?? c0;
              ctx.beginPath();
              ctx.moveTo(s.w / 2, s.h / 2);
              ctx.lineTo(s.w / 2 + Math.cos(a - w) * L, s.h / 2 + Math.sin(a - w) * L);
              ctx.lineTo(s.w / 2 + Math.cos(a + w) * L, s.h / 2 + Math.sin(a + w) * L);
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, spokes],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
