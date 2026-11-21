"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

const labels = [
  "เว็บ",
  "แอป",
  "โลโก้",
  "วิดีโอ",
  "ภาพ",
  "คอร์ส",
  "ร้าน",
  "บล็อก",
  "ระบบ",
  "เกม",
  "ป้าย",
  "เมนู",
];

/** Tiles spread over a ball you can spin by dragging; it coasts to a stop and names the tile facing you. */
export default function GlobeMenu({ count = 36 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-ink-700", "--em-blue-500", "--em-sky-400", "--em-ink-0"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        // points spread evenly on a sphere (golden spiral)
        const pts = Array.from({ length: count }, (_, i) => {
          const y = 1 - (2 * (i + 0.5)) / count;
          const r = Math.sqrt(1 - y * y);
          const a = i * Math.PI * (3 - Math.sqrt(5));
          return {
            x: Math.cos(a) * r,
            y,
            z: Math.sin(a) * r,
            label: labels[i % labels.length] ?? "",
          };
        });
        let yaw = 0;
        let pitch = 0;
        let vy = 0.3;
        let vp = 0;
        let lx = 0;
        let ly = 0;
        let held = false;
        return {
          draw: (_t, dt) => {
            const k = Math.min(dt, 1 / 30);
            if (s.pointer.down) {
              if (held) {
                vy = (((s.pointer.x - lx) / s.w) * 6) / Math.max(k, 1 / 120);
                vp = (((s.pointer.y - ly) / s.h) * 6) / Math.max(k, 1 / 120);
              }
              held = true;
              lx = s.pointer.x;
              ly = s.pointer.y;
            } else {
              held = false;
              vy *= 0.97;
              vp *= 0.9;
            }
            yaw += vy * k;
            pitch = Math.max(-0.8, Math.min(0.8, pitch + vp * k));
            const R = Math.min(s.w, s.h) * 0.36;
            const cy = Math.cos(yaw);
            const sy = Math.sin(yaw);
            const cp = Math.cos(pitch);
            const sp = Math.sin(pitch);
            const view = pts
              .map((p) => {
                const x = p.x * cy + p.z * sy;
                const z0 = -p.x * sy + p.z * cy;
                const y = p.y * cp - z0 * sp;
                const z = p.y * sp + z0 * cp;
                return { x: s.w / 2 + x * R, y: s.h / 2 + y * R, z, label: p.label };
              })
              .sort((a, b) => a.z - b.z);
            ctx.clearRect(0, 0, s.w, s.h);
            const front = view[view.length - 1];
            for (const p of view) {
              const size = 10 + (p.z + 1) * 14;
              ctx.globalAlpha = 0.25 + (p.z + 1) * 0.37;
              ctx.fillStyle = (p === front ? colors[2] : p.z > 0 ? colors[1] : colors[0]) ?? "";
              ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
            }
            ctx.globalAlpha = 1;
            if (front) {
              ctx.fillStyle = colors[3] ?? "";
              ctx.font = "600 16px 'Noto Sans Thai UI', sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(front.label, s.w / 2, s.h - 20);
            }
          },
        };
      }),
    [colors, count],
    { pointer: true },
  );
  return (
    <div className="relative size-full min-h-80 cursor-grab touch-none overflow-hidden bg-(--em-ink-975) active:cursor-grabbing">
      <canvas
        ref={ref}
        aria-label="ลูกโลกเมนู ลากเพื่อหมุน"
        role="img"
        className="vt-live absolute inset-0 size-full"
      />
    </div>
  );
}
