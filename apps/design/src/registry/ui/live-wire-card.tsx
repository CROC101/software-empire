"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * A card whose border is a live wire: the outline wobbles with a few summed waves that drift
 * round the edge, drawn twice (a wide soft pass and a thin bright core).
 */
export default function LiveWireCard({ amp = 4, speed = 1 }: { amp?: number; speed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-sky-400", "--em-ink-0"]);
  const pad = 16;
  useFx(
    ref,
    colors &&
      ((ctx, s) => ({
        draw: (t) => {
          const w = s.w - pad * 2;
          const h = s.h - pad * 2;
          const per = 2 * (w + h);
          const pts: [number, number][] = [];
          for (let d = 0; d <= per; d += 4) {
            // walk the rectangle, push each point out along its edge normal
            const [x, y, nx, ny] =
              d < w
                ? [pad + d, pad, 0, -1]
                : d < w + h
                  ? [pad + w, pad + d - w, 1, 0]
                  : d < 2 * w + h
                    ? [pad + w - (d - w - h), pad + h, 0, 1]
                    : [pad, pad + h - (d - 2 * w - h), -1, 0];
            const u = d / per;
            const off =
              Math.sin(u * 37 + t * 6 * speed) * 0.5 +
              Math.sin(u * 83 - t * 9 * speed) * 0.3 +
              Math.sin(u * 191 + t * 17 * speed) * 0.2;
            pts.push([x + nx * off * amp, y + ny * off * amp]);
          }
          ctx.clearRect(0, 0, s.w, s.h);
          ctx.lineJoin = "round";
          for (const [color, width, alpha] of [
            [colors[0], 6, 0.25],
            [colors[0], 2, 0.9],
            [colors[1], 0.75, 1],
          ] as const) {
            ctx.strokeStyle = color ?? "";
            ctx.lineWidth = width;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            for (const [x, y] of pts) ctx.lineTo(x, y);
            ctx.closePath();
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        },
      })),
    [colors, amp, speed],
  );
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="relative w-full max-w-xs">
        <canvas
          ref={ref}
          aria-hidden
          className="vt-live pointer-events-none absolute -inset-4 size-[calc(100%+2rem)]"
        />
        <article className="rounded-sm bg-(--em-ink-900) p-6">
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">live</p>
          <h3 className="mt-2 font-heading text-2xl font-black text-(--em-ink-50)">ไฟเข้าแล้ว</h3>
          <p className="mt-2 text-sm text-(--em-ink-400)">ขอบการ์ดสั่นตามกระแสที่วิ่งรอบตัว</p>
        </article>
      </div>
    </div>
  );
}
