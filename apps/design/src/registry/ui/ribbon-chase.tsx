"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * Ribbons chase the pointer, each a chain of points that follows the one ahead of it, so they
 * curl and overlap as you move. With no pointer they trace a slow loop.
 */
export default function RibbonChase({
  count = 3,
  thickness = 10,
}: {
  count?: number;
  thickness?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-blue-500", "--em-blue-300", "--em-ink-100"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const links = 28;
        const ribbons = Array.from({ length: count }, () =>
          Array.from({ length: links }, () => [s.w / 2, s.h / 2] as [number, number]),
        );
        return {
          draw: (t, dt) => {
            const step = Math.min(dt * 60, 2);
            const hx = s.pointer.on ? s.pointer.x : s.w * (0.5 + 0.35 * Math.sin(t * 0.7));
            const hy = s.pointer.on ? s.pointer.y : s.h * (0.5 + 0.3 * Math.sin(t * 1.3));
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ribbons.forEach((pts, r) => {
              // each ribbon leads with a different lag so they separate
              const ease = (0.12 + r * 0.06) * step;
              pts.forEach((p, i) => {
                const [tx, ty] = i === 0 ? [hx, hy] : (pts[i - 1] ?? p);
                p[0] += (tx - p[0]) * Math.min(1, i === 0 ? ease : 0.5 * step);
                p[1] += (ty - p[1]) * Math.min(1, i === 0 ? ease : 0.5 * step);
              });
              ctx.strokeStyle = colors[r % colors.length] ?? "";
              for (let i = 1; i < pts.length; i++) {
                const a = pts[i - 1];
                const b = pts[i];
                if (!a || !b) continue;
                ctx.lineWidth = thickness * (1 - i / pts.length);
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.stroke();
              }
            });
          },
        };
      }),
    [colors, count, thickness],
    { pointer: true },
  );
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ขยับเมาส์ในกรอบนี้</p>
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
