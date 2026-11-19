"use client";

import { useEffect, useRef } from "react";

export interface ParticlesConstellationBgProps {
  particleCount?: number;
  linkDistance?: number;
  particleColor?: string;
  speed?: number;
  particleSize?: number;
  mouseInteraction?: boolean;
  className?: string;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export default function ParticlesConstellationBg({
  particleCount = 90,
  linkDistance = 120,
  particleColor = "#c4b5fd",
  speed = 0.4,
  particleSize = 1.6,
  mouseInteraction = true,
  className = "",
}: ParticlesConstellationBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pts = Array.from({ length: particleCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));
    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    if (mouseInteraction) {
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseleave", onLeave);
    }
    const rgb = hexToRgb(particleColor);
    const d2 = linkDistance * linkDistance;

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dd = dx * dx + dy * dy;
          if (dd < d2) {
            ctx.strokeStyle = `rgba(${rgb}, ${0.35 * (1 - dd / d2)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const mx = a.x - mouse.x;
        const my = a.y - mouse.y;
        const md = mx * mx + my * my;
        if (md < d2 * 1.6) {
          ctx.strokeStyle = `rgba(${rgb}, ${0.6 * (1 - md / (d2 * 1.6))})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${rgb}, 0.9)`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [particleCount, linkDistance, particleColor, speed, particleSize, mouseInteraction]);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} />;
}
