"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A spider web of spokes and rings that sways and leans toward the pointer, the rings glinting in turn. */
export default function DewWeb({ speed = 1, rings = 8 }: { speed?: number; rings?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const ox = s.pointer.on ? (s.pointer.x - s.w / 2) * 0.08 : Math.sin(T * 0.5) * 8;
            const oy = s.pointer.on ? (s.pointer.y - s.h / 2) * 0.08 : Math.cos(T * 0.4) * 6;
            const spokes = 14;
            const R = Math.min(s.w, s.h) * 0.48;
            const at = (j: number, r: number) => {
              const a = (j / spokes) * Math.PI * 2;
              const bend = (r / R) ** 2;
              return [
                s.w / 2 + Math.cos(a) * r + ox * bend,
                s.h / 2 + Math.sin(a) * r + oy * bend,
              ] as const;
            };
            ctx.lineWidth = 1;
            ctx.strokeStyle = c0;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            for (let j = 0; j < spokes; j++) {
              const [x, y] = at(j, R);
              ctx.moveTo(s.w / 2, s.h / 2);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.strokeStyle = c1;
            for (let k = 1; k <= rings; k++) {
              const r = (k / rings) * R;
              ctx.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(T * 2 - k));
              ctx.beginPath();
              for (let j = 0; j <= spokes; j++) {
                const [x, y] = at(j % spokes, r * (1 + 0.03 * Math.sin(j * 2 + T)));
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
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
