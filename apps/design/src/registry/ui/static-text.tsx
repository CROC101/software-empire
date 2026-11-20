"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

/**
 * Bad reception: the word is torn into thin rows that jitter sideways, harder while the pointer is
 * on it. Canvas 2D, ink colour read from CSS so it follows the theme, paused off screen.
 */
export default function StaticText({
  text = "NO SIGNAL",
  intensity = 0.2,
  hover = 0.6,
}: {
  text?: string;
  intensity?: number;
  hover?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const dpr = Math.min(devicePixelRatio, 2);
    const size = 96 * dpr;
    const font = `900 ${String(size)}px ${getComputedStyle(cv).fontFamily}`;
    const src = document.createElement("canvas");
    const sctx = src.getContext("2d");
    if (!sctx) return;
    sctx.font = font;
    const w = Math.ceil(sctx.measureText(text).width) + size;
    const h = Math.ceil(size * 1.4);
    src.width = w;
    src.height = h;
    sctx.font = font;
    sctx.fillStyle = getComputedStyle(cv).color;
    sctx.textBaseline = "middle";
    sctx.fillText(text, size / 2, h / 2);
    cv.width = w;
    cv.height = h;
    cv.style.aspectRatio = `${String(w)} / ${String(h)}`;

    let amp = intensity;
    let target = intensity;
    let raf = 0;
    let on = true;
    const draw = () => {
      amp += (target - amp) * 0.15;
      ctx.clearRect(0, 0, w, h);
      const row = Math.max(1, Math.round(2 * dpr));
      for (let y = 0; y < h; y += row) {
        const dx = still ? 0 : (Math.random() - 0.5) * amp * size;
        ctx.drawImage(src, 0, y, w, row, dx, y, w, row);
      }
      if (on && !still) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      on = Boolean(e?.isIntersecting);
      cancelAnimationFrame(raf);
      if (on) draw();
    });
    io.observe(cv);
    const enter = () => (target = hover);
    const leave = () => (target = intensity);
    cv.addEventListener("pointerenter", enter);
    cv.addEventListener("pointerleave", leave);
    draw();
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerenter", enter);
      cv.removeEventListener("pointerleave", leave);
    };
  }, [text, intensity, hover, still]);

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <canvas
        ref={ref}
        role="img"
        aria-label={text}
        className="w-full max-w-2xl font-heading text-(--em-ink-50)"
      />
    </div>
  );
}
