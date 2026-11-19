"use client";

import { useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

type Blip = { a: number; r: number; lit: number };

const TAU = Math.PI * 2;

/** A sonar screen: rings, a turning sweep with a fading trail, and contacts that glow as the sweep passes. */
export default function RadarSweep({
  speed = 0.8,
  contacts = 9,
}: {
  speed?: number;
  contacts?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(["--em-blue-700", "--em-sky-400", "--em-ink-50"]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const [grid = "#333", beam = "#fff", ping = "#fff"] = colors;
        const blips: Blip[] = Array.from({ length: contacts }, () => ({
          a: Math.random() * TAU,
          r: 0.2 + Math.random() * 0.75,
          lit: 0,
        }));
        let prev = 0;
        return {
          draw: (t, dt) => {
            const cx = s.w / 2;
            const cy = s.h / 2;
            const R = Math.min(s.w, s.h) * 0.45;
            const sweep = (t * speed) % TAU;
            ctx.clearRect(0, 0, s.w, s.h);
            ctx.strokeStyle = grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let k = 1; k <= 4; k++) {
              ctx.moveTo(cx + (R * k) / 4, cy);
              ctx.arc(cx, cy, (R * k) / 4, 0, TAU);
            }
            ctx.moveTo(cx - R, cy);
            ctx.lineTo(cx + R, cy);
            ctx.moveTo(cx, cy - R);
            ctx.lineTo(cx, cy + R);
            ctx.stroke();
            // trail: thin wedges, each fainter than the one ahead
            ctx.fillStyle = beam;
            for (let k = 0; k < 24; k++) {
              ctx.globalAlpha = 0.18 * (1 - k / 24);
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.arc(cx, cy, R, sweep - (k + 1) * 0.04, sweep - k * 0.04);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.strokeStyle = beam;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
            ctx.stroke();
            ctx.fillStyle = ping;
            for (const b of blips) {
              const crossed =
                prev <= sweep ? b.a > prev && b.a <= sweep : b.a > prev || b.a <= sweep;
              b.lit = crossed ? 1 : Math.max(0, b.lit - dt * 0.5);
              if (!b.lit) continue;
              ctx.globalAlpha = b.lit;
              ctx.beginPath();
              ctx.arc(
                cx + Math.cos(b.a) * b.r * R,
                cy + Math.sin(b.a) * b.r * R,
                2 + b.lit * 2,
                0,
                TAU,
              );
              ctx.fill();
            }
            ctx.globalAlpha = 1;
            prev = sweep;
          },
        };
      }),
    [colors, speed, contacts],
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={ref} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
