"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A square grid that bulges outward around the pointer like a lens pressed into it. */
export default function WarpGrid({ speed = 1, cell = 28 }: { speed?: number; cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const mx = s.pointer.on ? s.pointer.x : s.w / 2 + Math.cos(T * 0.5) * s.w * 0.25;
            const my = s.pointer.on ? s.pointer.y : s.h / 2 + Math.sin(T * 0.7) * s.h * 0.25;
            const R = Math.min(s.w, s.h) * 0.3;
            const warp = (x: number, y: number) => {
              const dx = x - mx;
              const dy = y - my;
              const f = Math.exp(-(dx * dx + dy * dy) / (R * R)) * 0.6;
              return [x + dx * f, y + dy * f] as const;
            };
            ctx.lineWidth = 1;
            ctx.strokeStyle = c0;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            for (let y = 0; y <= s.h; y += cell)
              for (let x = 0; x <= s.w; x += 6) {
                const [a, b] = warp(x, y);
                if (x === 0) ctx.moveTo(a, b);
                else ctx.lineTo(a, b);
              }
            for (let x = 0; x <= s.w; x += cell)
              for (let y = 0; y <= s.h; y += 6) {
                const [a, b] = warp(x, y);
                if (y === 0) ctx.moveTo(a, b);
                else ctx.lineTo(a, b);
              }
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.fillStyle = c1;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
          },
        };
      }),
    [colors, speed, cell],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
