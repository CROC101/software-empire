"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A field of short dashes that lift and point away from the pointer, settling back when it moves on. */
export default function LiftField({ speed = 1, gap = 26 }: { speed?: number; gap?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const mx = s.pointer.on ? s.pointer.x : s.w / 2 + Math.cos(T * 0.6) * s.w * 0.25;
            const my = s.pointer.on ? s.pointer.y : s.h / 2 + Math.sin(T * 0.8) * s.h * 0.2;
            ctx.lineCap = "round";
            for (let y = gap / 2; y < s.h; y += gap)
              for (let x = gap / 2; x < s.w; x += gap) {
                const dx = x - mx;
                const dy = y - my;
                const f = Math.max(0, 1 - Math.hypot(dx, dy) / 220);
                const lift = f * 18 + Math.sin(T * 2 + x * 0.05) * 2;
                const a = Math.atan2(dy, dx);
                const len = lift + 4 + f * 6;
                ctx.strokeStyle = f > 0.3 ? c1 : c0;
                ctx.globalAlpha = 0.3 + f * 0.7;
                ctx.lineWidth = 1.5 + f * 1.5;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(a) * lift, y + Math.sin(a) * lift - lift * 0.5);
                ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len - lift * 0.5);
                ctx.stroke();
              }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, gap],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
