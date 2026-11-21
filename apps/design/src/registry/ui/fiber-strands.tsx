"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * Hanging strands sway like fibre in a current. Near the pointer they lean away and slowly drift
 * back. Canvas 2D on the shared clock.
 */
export default function FiberStrands({ count = 36, sway = 18 }: { count?: number; sway?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-700", "--em-blue-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        let push: number[] = [];
        return {
          resize: () => {
            push = Array.from({ length: count }, () => 0);
          },
          draw: (t) => {
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1.25;
            for (let i = 0; i < count; i++) {
              const x0 = ((i + 0.5) / count) * s.w;
              const near = s.pointer.on ? s.pointer.x - x0 : Infinity;
              const want = Math.abs(near) < 80 ? -Math.sign(near) * (80 - Math.abs(near)) * 0.6 : 0;
              push[i] = (push[i] ?? 0) + (want - (push[i] ?? 0)) * 0.08;
              ctx.strokeStyle = colors[i % colors.length] ?? "";
              ctx.globalAlpha = 0.5 + 0.5 * Math.sin(i * 1.7) ** 2;
              ctx.beginPath();
              for (let y = 0; y <= s.h; y += 8) {
                const k = y / s.h;
                // free end swings more than the anchored top
                const x =
                  x0 +
                  Math.sin(t * 0.9 + i * 0.45 + k * 3) * sway * k +
                  Math.sin(t * 1.7 + i) * sway * 0.3 * k +
                  (push[i] ?? 0) * k * k;
                ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, count, sway],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
