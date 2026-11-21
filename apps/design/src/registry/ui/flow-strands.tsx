"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Hundreds of short strands traced through a drifting flow field, like iron filings in a moving current. */
export default function FlowStrands({
  speed = 0.5,
  lines = 400,
}: {
  speed?: number;
  lines?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-600", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        const h = (k: number) => {
          const x = Math.sin(k * 127.1) * 43758.5453;
          return x - Math.floor(x);
        };
        let pts: { x: number; y: number }[] = [];
        return {
          resize: () => {
            pts = Array.from({ length: lines }, (_, i) => ({ x: h(i) * s.w, y: h(i + 99) * s.h }));
          },
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            for (const [i, p] of pts.entries()) {
              let x = p.x;
              let y = p.y;
              ctx.strokeStyle = i % 4 === 0 ? c1 : c0;
              ctx.beginPath();
              ctx.moveTo(x, y);
              for (let k = 0; k < 14; k++) {
                const a = Math.sin(x * 0.006 + T) * 2 + Math.cos(y * 0.007 - T * 0.8) * 2;
                x += Math.cos(a) * 4;
                y += Math.sin(a) * 4;
                ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, lines],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
