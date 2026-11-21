"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** Thin glass triangles float and turn slowly, each a faint pane with a lit rim. */
export default function GlassShards({
  speed = 0.4,
  count = 18,
}: {
  speed?: number;
  count?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        const h = (k: number) => {
          const x = Math.sin(k * 127.1) * 43758.5453;
          return x - Math.floor(x);
        };
        let shards: { x: number; y: number; r: number; a: number; w: number }[] = [];
        return {
          resize: () => {
            shards = Array.from({ length: count }, (_, i) => ({
              x: h(i) * s.w,
              y: h(i + 7) * s.h,
              r: 20 + h(i + 3) * 60,
              a: h(i + 5) * 6.28,
              w: (h(i + 11) - 0.5) * 0.6,
            }));
          },
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineWidth = 1;
            for (const p of shards) {
              const a = p.a + T * p.w;
              const y = p.y + Math.sin(T + p.a) * 20;
              ctx.beginPath();
              for (let j = 0; j < 3; j++) {
                const b = a + (j * Math.PI * 2) / 3 + (j === 1 ? 0.4 : 0);
                const x1 = p.x + Math.cos(b) * p.r;
                const y1 = y + Math.sin(b) * p.r * 0.7;
                if (j === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
              }
              ctx.closePath();
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = c0;
              ctx.fill();
              ctx.globalAlpha = 0.6;
              ctx.strokeStyle = c1;
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          },
        };
      }),
    [colors, speed, count],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
