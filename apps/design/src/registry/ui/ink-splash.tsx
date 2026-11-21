"use client";

import { fxRgb, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Drop = { x: number; y: number; vx: number; vy: number; r: number; c: number };

/**
 * Coloured ink spills from the pointer and keeps drifting with the speed you gave it, spreading
 * and fading like dye in water. A light stand-in for a fluid sim: soft blobs, added light, slow fade.
 */
export default function InkSplash({ spread = 1, fade = 0.06 }: { spread?: number; fade?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-500", "--em-blue-300"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const rgb = colors.map((c) => fxRgb(c).join(" "));
        const drops: Drop[] = [];
        let last: [number, number] | null = null;
        let n = 0;
        return {
          resize: () => {
            ctx.clearRect(0, 0, s.w, s.h);
          },
          draw: (t, dt) => {
            const step = Math.min(dt * 60, 2);
            const x = s.pointer.on ? s.pointer.x : s.w * (0.5 + 0.3 * Math.cos(t * 0.8));
            const y = s.pointer.on ? s.pointer.y : s.h * (0.5 + 0.3 * Math.sin(t * 1.4));
            const [lx, ly] = last ?? [x, y];
            last = [x, y];
            const vx = x - lx;
            const vy = y - ly;
            if (Math.hypot(vx, vy) > 0.5 && drops.length < 220)
              drops.push({ x, y, vx: vx * 0.6, vy: vy * 0.6, r: 10, c: n++ % rgb.length });
            // fade what is already there instead of clearing, so the ink leaves a stain
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = `rgb(0 0 0 / ${String(fade * step)})`;
            ctx.fillRect(0, 0, s.w, s.h);
            ctx.globalCompositeOperation = "lighter";
            for (let i = drops.length - 1; i >= 0; i--) {
              const d = drops[i];
              if (!d) continue;
              d.x += d.vx * step;
              d.y += d.vy * step;
              d.vx *= 0.95;
              d.vy *= 0.95;
              d.r += 0.9 * spread * step;
              if (d.r > 90) {
                drops.splice(i, 1);
                continue;
              }
              const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
              g.addColorStop(0, `rgb(${rgb[d.c] ?? ""} / ${String(0.25 * (1 - d.r / 90))})`);
              g.addColorStop(1, `rgb(${rgb[d.c] ?? ""} / 0)`);
              ctx.fillStyle = g;
              ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
            }
            ctx.globalCompositeOperation = "source-over";
          },
        };
      }),
    [colors, spread, fade],
    { pointer: true, res: 0.35 },
  );
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ขยับเมาส์ในกรอบนี้</p>
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
