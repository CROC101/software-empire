"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/** A drop of magnetic fluid; spikes rise on the side facing the pointer and settle when it leaves. */
export default function FerroSpikes({
  speed = 1,
  spikes = 24,
}: {
  speed?: number;
  spikes?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-800", "--em-sky-400"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [c0 = "", c1 = ""] = colors;
        return {
          draw: (t) => {
            const T = t * speed;
            ctx.clearRect(0, 0, s.w, s.h);
            const cx = s.w / 2;
            const cy = s.h / 2;
            const R = Math.min(s.w, s.h) * 0.2;
            const pa = Math.atan2(s.pointer.y - cy, s.pointer.x - cx);
            const pull = s.pointer.on
              ? Math.max(0, 1 - Math.hypot(s.pointer.x - cx, s.pointer.y - cy) / (R * 4))
              : 0;
            ctx.beginPath();
            for (let j = 0; j <= 360; j++) {
              const a = (j / 360) * Math.PI * 2;
              const face = pull * Math.max(0, Math.cos(a - pa)) ** 3;
              const spike = Math.abs(Math.sin(a * spikes * 0.5 + T * 0.5)) ** 6;
              const r = R * (1 + 0.04 * Math.sin(a * 3 + T * 2) + spike * (0.1 + face * 0.9));
              const x = cx + Math.cos(a) * r;
              const y = cy + Math.sin(a) * r;
              if (j === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = c0;
            ctx.fill();
            ctx.strokeStyle = c1;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          },
        };
      }),
    [colors, speed, spikes],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label="หยดของเหลวแม่เหล็ก ชี้ใกล้ๆ แล้วหนามตั้งขึ้น"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
