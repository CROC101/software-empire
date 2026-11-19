"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Star = { r: number; a: number; size: number; alpha: number };

/** A tilted spiral galaxy: stars on curved arms, the inner ones turning faster than the rim. */
export default function DeepGalaxy({
  arms = 3,
  speed = 0.4,
  stars = 1400,
}: {
  arms?: number;
  speed?: number;
  stars?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-50", "--em-sky-400", "--em-blue-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [core = "#fff", mid = "#fff", rim = "#fff"] = colors;
        const list: Star[] = Array.from({ length: stars }, (_, i) => {
          const r = Math.pow(Math.random(), 1.6);
          const arm = ((i % arms) / arms) * Math.PI * 2;
          return {
            r,
            a: arm + r * 5 + (Math.random() - 0.5) * (0.9 - r * 0.5),
            size: Math.random() < 0.05 ? 2 : 1,
            alpha: 0.35 + Math.random() * 0.65,
          };
        });
        return {
          draw: (t) => {
            ctx.clearRect(0, 0, s.w, s.h);
            const R = Math.min(s.w, s.h * 1.6) * 0.48;
            const px = s.pointer.on ? (s.pointer.x / s.w - 0.5) * 24 : 0;
            const cx = s.w / 2 - px;
            const cy = s.h / 2;
            for (const st of list) {
              const a = st.a + (t * speed) / (0.25 + st.r);
              ctx.globalAlpha = st.alpha * (1 - st.r * 0.5);
              ctx.fillStyle = st.r < 0.15 ? core : st.r < 0.5 ? mid : rim;
              ctx.fillRect(
                cx + Math.cos(a) * st.r * R,
                cy + Math.sin(a) * st.r * R * 0.5,
                st.size,
                st.size,
              );
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, arms, speed, stars],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
