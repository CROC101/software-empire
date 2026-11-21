"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * A picture arrives as a halftone: dots swell along a diagonal sweep until they touch and the
 * picture is whole, rest a moment, then shrink away and start again. Tap to restart.
 */
export default function HalftoneWipe({
  cell = 12,
  duration = 3,
}: {
  cell?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-500", "--em-blue-800", "--em-ink-975"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        let start = 0;
        return {
          draw: (t, dt) => {
            if (s.pointer.down === 0) start = t;
            // 0..1 grow, hold, 1..0 shrink, hold
            const cyc = ((t - start) / duration) % 2.6;
            // a still frame (reduced motion, off screen) shows the whole picture
            const p = dt === 0 ? 1 : cyc < 1 ? cyc : cyc < 1.3 ? 1 : cyc < 2.3 ? 2.3 - cyc : 0;
            ctx.clearRect(0, 0, s.w, s.h);
            for (let y = cell / 2; y < s.h + cell; y += cell) {
              const i = Math.min(255, Math.floor((y / s.h) * 255)) * 3;
              ctx.fillStyle = `rgb(${String(ramp[i])} ${String(ramp[i + 1])} ${String(ramp[i + 2])})`;
              for (let x = cell / 2; x < s.w + cell; x += cell) {
                const at = (x / s.w + y / s.h) / 2;
                const k = Math.min(1, Math.max(0, p * 1.6 - at * 0.6));
                if (k <= 0) continue;
                ctx.beginPath();
                ctx.arc(x, y, k * cell * 0.72, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          },
        };
      }),
    [colors, cell, duration],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label="ภาพสีน้ำค่อยๆ ปรากฏเป็นจุดฮาล์ฟโทน"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
