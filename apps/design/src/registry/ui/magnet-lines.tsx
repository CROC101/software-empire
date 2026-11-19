"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A field of short needles that all turn to face the pointer, or a point circling when it is away. */
export default function MagnetLines({ gap = 28, length = 12 }: { gap?: number; length?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-500", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [dim = "#888", hot = "#fff"] = colors;
        let tx = 0;
        let ty = 0;
        return {
          draw: (t, dt) => {
            const wantX = s.pointer.on ? s.pointer.x : s.w / 2 + Math.cos(t * 0.7) * s.w * 0.3;
            const wantY = s.pointer.on ? s.pointer.y : s.h / 2 + Math.sin(t * 0.9) * s.h * 0.3;
            const ease = dt ? Math.min(1, dt * 6) : 1;
            tx += (wantX - tx) * ease;
            ty += (wantY - ty) * ease;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineCap = "round";
            ctx.lineWidth = 2;
            const reach = Math.max(s.w, s.h) * 0.35;
            for (let y = gap / 2; y < s.h; y += gap)
              for (let x = gap / 2; x < s.w; x += gap) {
                const a = Math.atan2(ty - y, tx - x);
                const near = Math.max(0, 1 - Math.hypot(tx - x, ty - y) / reach);
                const half = (length / 2) * (0.6 + near * 0.6);
                ctx.strokeStyle = near > 0.55 ? hot : dim;
                ctx.globalAlpha = 0.35 + near * 0.65;
                ctx.beginPath();
                ctx.moveTo(x - Math.cos(a) * half, y - Math.sin(a) * half);
                ctx.lineTo(x + Math.cos(a) * half, y + Math.sin(a) * half);
                ctx.stroke();
              }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, gap, length],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
