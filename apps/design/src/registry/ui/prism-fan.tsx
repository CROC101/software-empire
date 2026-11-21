"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A beam enters a glass prism from the left and leaves as a fan of shimmering bands. */
export default function PrismFan({ speed = 0.5 }: { speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-500", "--em-sky-400", "--em-ink-0", "--em-ink-300"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = "", c2 = "", c3 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const cx = s.w * 0.4;
            const cy = s.h / 2;
            const r = Math.min(s.w, s.h) * 0.18;
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = c2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, cy + r * 0.3);
            ctx.lineTo(cx - r * 0.4, cy);
            ctx.stroke();
            const tones = [c0, c1, c2];
            for (let k = 0; k < 7; k++) {
              const a = -0.25 + (k / 6) * 0.5 + Math.sin(T + k) * 0.02;
              ctx.globalAlpha = 0.25 + 0.15 * Math.sin(T * 2 + k);
              ctx.fillStyle = tones[k % 3] ?? c0;
              ctx.beginPath();
              ctx.moveTo(cx + r * 0.4, cy);
              ctx.lineTo(s.w, cy + Math.tan(a - 0.03) * (s.w - cx));
              ctx.lineTo(s.w, cy + Math.tan(a + 0.03) * (s.w - cx));
              ctx.closePath();
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = c3;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let j = 0; j < 3; j++) {
              const a = -Math.PI / 2 + (j * Math.PI * 2) / 3;
              ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.stroke();
          },
        };
      }),
    [colors, speed],
    { pointer: false },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
