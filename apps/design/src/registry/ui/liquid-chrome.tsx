"use client";

import { fxRamp, useFx, useTokenColors } from "@empire/ui";
import { useRef } from "react";

/**
 * A word cast in liquid metal: bright and dark bands flow through the letters on a slow warp, like
 * a polished surface catching the sky. Drawn into a small pixel buffer and scaled up.
 */
export default function LiquidChrome({
  text = "CROC",
  speed = 1,
}: {
  text?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors([
    "--em-ink-975",
    "--em-blue-700",
    "--em-ink-100",
    "--em-sky-400",
    "--em-ink-0",
    "--em-blue-500",
  ]);
  useFx(
    ref,
    colors &&
      ((ctx, s) => {
        const ramp = fxRamp(colors);
        const family = getComputedStyle(ctx.canvas).fontFamily;
        let mask = new Uint8ClampedArray(0);
        let img = ctx.createImageData(1, 1);
        return {
          resize: () => {
            // the letters' alpha, read once per size
            const off = document.createElement("canvas");
            off.width = s.pw;
            off.height = s.ph;
            const g = off.getContext("2d", { willReadFrequently: true });
            img = ctx.createImageData(s.pw, s.ph);
            if (!g) return;
            const size = Math.min((s.pw * 1.5) / Math.max(text.length, 1), s.ph * 0.6);
            g.font = `900 ${String(size)}px ${family}`;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(text, s.pw / 2, s.ph / 2);
            const a = g.getImageData(0, 0, s.pw, s.ph).data;
            mask = new Uint8ClampedArray(s.pw * s.ph);
            for (let i = 0; i < mask.length; i++) mask[i] = a[i * 4 + 3] ?? 0;
          },
          draw: (t) => {
            const d = img.data;
            const tt = t * 0.6 * speed;
            for (let y = 0; y < s.ph; y++)
              for (let x = 0; x < s.pw; x++) {
                const i = y * s.pw + x;
                const a = mask[i] ?? 0;
                const o = i * 4;
                d[o + 3] = a;
                if (!a) continue;
                const u = x / s.pw;
                const v = y / s.ph;
                const w = Math.sin(u * 6 + tt) + Math.sin(v * 9 - tt * 1.3 + Math.sin(u * 4 + tt));
                const band = 0.5 + 0.5 * Math.sin(v * 7 + w * 1.6);
                const c = Math.floor(band * 255) * 3;
                d[o] = ramp[c] ?? 0;
                d[o + 1] = ramp[c + 1] ?? 0;
                d[o + 2] = ramp[c + 2] ?? 0;
              }
            ctx.putImageData(img, 0, 0);
          },
        };
      }),
    [colors, text, speed],
    { res: 0.5 },
  );
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas
        ref={ref}
        role="img"
        aria-label={text}
        className="vt-live absolute inset-0 size-full font-heading"
      />
    </div>
  );
}
