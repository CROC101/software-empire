"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Faint vertical fibres sway on two slow waves, brightening and dimming one by one. */
export default function GhostStrands({
  speed = 0.4,
  strands = 40,
}: {
  speed?: number;
  strands?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-300", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            for (let i = 0; i < strands; i++) {
              const x0 = ((i + 0.5) / strands) * s.w;
              ctx.strokeStyle = i % 5 === 0 ? c1 : c0;
              ctx.globalAlpha = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(i * 1.7 + T));
              ctx.beginPath();
              for (let y = 0; y <= s.h; y += 12) {
                const x =
                  x0 +
                  Math.sin(y * 0.01 + T + i * 0.4) * 30 +
                  Math.sin(y * 0.023 - T * 1.3 + i) * 12;
                if (y === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, strands],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
