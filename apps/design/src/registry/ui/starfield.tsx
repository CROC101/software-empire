"use client";

import { useReducedMotionAfterMount, useTokenColors } from "@empire/ui";
import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number };

/** Stars rush toward the camera on a canvas. Paused while off screen, still under reduced motion. */
export default function Starfield({
  stars = 180,
  speed = 1.5,
}: {
  stars?: number;
  speed?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotionAfterMount();
  const colors = useTokenColors(["--em-ink-50", "--em-sky-400"]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !colors) return;
    const [white = "#fff", sky = "#fff"] = colors;
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = false;
    const field: Star[] = Array.from({ length: stars }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const [i, s] of field.entries()) {
        if (!still) {
          s.z -= 0.004 * speed;
          if (s.z <= 0.02) {
            s.x = Math.random() * 2 - 1;
            s.y = Math.random() * 2 - 1;
            s.z = 1;
          }
        }
        const px = w / 2 + (s.x / s.z) * (w / 4);
        const py = h / 2 + (s.y / s.z) * (h / 4);
        ctx.globalAlpha = Math.min(1, (1 - s.z) * 1.4);
        ctx.fillStyle = i % 5 === 0 ? sky : white;
        ctx.beginPath();
        ctx.arc(px, py, (1 - s.z) * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = !still && visible ? requestAnimationFrame(draw) : 0;
    };

    const fit = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!frame) draw();
    });
    const seen = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible && !frame) draw();
    });
    fit.observe(c);
    seen.observe(c);
    return () => {
      cancelAnimationFrame(frame);
      fit.disconnect();
      seen.disconnect();
    };
  }, [colors, stars, speed, still]);

  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <canvas ref={canvas} aria-hidden className="vt-live absolute inset-0 size-full" />
    </div>
  );
}
