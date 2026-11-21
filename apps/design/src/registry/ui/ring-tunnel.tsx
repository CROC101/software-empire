"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Rings rush toward the camera down a tunnel whose far end follows the pointer. */
export default function RingTunnel({ speed = 1 }: { speed?: number }) {
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
            const vx = s.pointer.on
              ? (s.pointer.x - s.w / 2) * 0.6
              : Math.sin(T * 0.4) * s.w * 0.15;
            const vy = s.pointer.on
              ? (s.pointer.y - s.h / 2) * 0.6
              : Math.cos(T * 0.3) * s.h * 0.15;
            const R = Math.max(s.w, s.h);
            for (let k = 0; k < 24; k++) {
              const z = 1 - ((T * 0.25 + k / 24) % 1);
              const r = (R * 0.05) / (z + 0.05);
              ctx.strokeStyle = k % 3 === 0 ? c1 : c0;
              ctx.globalAlpha = Math.min(1, (1 - z) * 1.5) * 0.8;
              ctx.lineWidth = 1 + (1 - z) * 3;
              ctx.beginPath();
              ctx.arc(s.w / 2 + vx * z, s.h / 2 + vy * z, r, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
