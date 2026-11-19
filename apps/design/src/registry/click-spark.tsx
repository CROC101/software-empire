"use client";

import { useReducedMotionAfterMount, useTokenColors } from "@empire/ui";
import { useEffect, useRef, type PointerEvent } from "react";

type Spark = { x: number; y: number; angle: number; start: number };

const tones = {
  blue: "--em-blue-400",
  sky: "--em-sky-400",
  violet: "--em-violet-500",
  teal: "--em-teal-400",
} as const;

/** Lines burst out of every pointer-down point; one rAF loop that stops when no sparks are left. */
export function ClickSpark({
  count = 8,
  radius = 26,
  duration = 450,
  tone = "sky",
}: {
  count?: number;
  radius?: number;
  duration?: number;
  tone?: keyof typeof tones;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const frame = useRef(0);
  const still = useReducedMotionAfterMount();
  const [color] = useTokenColors([tones[tone]]) ?? [];

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    fit.observe(c);
    return () => {
      fit.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  function draw(now: number) {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
    sparks.current = sparks.current.filter((s) => now - s.start < duration);
    ctx.strokeStyle = color ?? "currentColor";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const s of sparks.current) {
      const t = (now - s.start) / duration;
      const eased = t * (2 - t);
      const len = 10 * (1 - eased);
      const from = eased * radius;
      ctx.beginPath();
      ctx.moveTo(s.x + from * Math.cos(s.angle), s.y + from * Math.sin(s.angle));
      ctx.lineTo(s.x + (from + len) * Math.cos(s.angle), s.y + (from + len) * Math.sin(s.angle));
      ctx.stroke();
    }
    frame.current = sparks.current.length ? requestAnimationFrame(draw) : 0;
  }

  function burst(e: PointerEvent<HTMLDivElement>) {
    if (still) return;
    const r = e.currentTarget.getBoundingClientRect();
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      sparks.current.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        angle: (2 * Math.PI * i) / count,
        start: now,
      });
    }
    if (!frame.current) frame.current = requestAnimationFrame(draw);
  }

  return (
    <div
      onPointerDown={burst}
      className="relative flex size-full min-h-56 cursor-crosshair items-center justify-center bg-(--em-ink-975) select-none"
    >
      <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
      <p className="text-sm text-(--em-ink-400)">แตะหรือคลิกตรงไหนก็ได้</p>
    </div>
  );
}
