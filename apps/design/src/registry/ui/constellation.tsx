"use client";

import { useReducedMotionAfterMount, useTokenColors } from "@empire/ui";
import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; vx: number; vy: number };

/** Drifting dots that link to near neighbours and to the pointer. Paused while off screen. */
export function Constellation({
  count = 60,
  link = 120,
  speed = 0.5,
  mouse = true,
}: {
  count?: number;
  link?: number;
  speed?: number;
  mouse?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotionAfterMount();
  const colors = useTokenColors(["--em-sky-400", "--em-blue-400"]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !colors) return;
    const [dotColor = "#000", lineColor = "#000"] = colors;
    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let frame = 0;
    let visible = false;
    const pointer = { x: -9999, y: -9999 };

    const seed = () => {
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        if (!still) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > w) d.vx *= -1;
          if (d.y < 0 || d.y > h) d.vy *= -1;
        }
        ctx.fillStyle = dotColor;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      const pts = mouse ? [...dots, pointer] : dots;
      dots.forEach((a, i) => {
        for (const b of pts.slice(i + 1)) {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > link) continue;
          ctx.globalAlpha = (1 - dist / link) * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });
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
      seed();
      if (!frame) draw();
    });
    const seen = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible && !frame) draw();
    });
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      if (still) draw();
    };
    const out = () => {
      pointer.x = pointer.y = -9999;
    };
    fit.observe(c);
    seen.observe(c);
    c.parentElement?.addEventListener("pointermove", move);
    c.parentElement?.addEventListener("pointerleave", out);
    return () => {
      cancelAnimationFrame(frame);
      fit.disconnect();
      seen.disconnect();
      c.parentElement?.removeEventListener("pointermove", move);
      c.parentElement?.removeEventListener("pointerleave", out);
    };
  }, [colors, count, link, speed, mouse, still]);

  return (
    <div className="relative flex size-full min-h-56 items-center justify-center overflow-hidden bg-(--em-ink-975)">
      <canvas ref={canvas} aria-hidden className="vt-live absolute inset-0 size-full" />
      <p className="pointer-events-none relative font-heading text-2xl font-black text-(--em-ink-50)">
        เชื่อมทุกระบบเข้าหากัน
      </p>
    </div>
  );
}

export default Constellation;
