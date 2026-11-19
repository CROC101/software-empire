"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface ClickSparkCanvasProps {
  children?: ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  sparkRadius?: number;
  sparkSize?: number;
  duration?: number;
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  start: number;
}

export default function ClickSparkCanvas({
  children,
  sparkColor = "#ffffff",
  sparkCount = 8,
  sparkRadius = 24,
  sparkSize = 12,
  duration = 450,
  className = "",
}: ClickSparkCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const opts = useRef({ sparkColor, sparkRadius, sparkSize, duration });
  opts.current = { sparkColor, sparkRadius, sparkSize, duration };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const draw = (now: number) => {
      const { sparkColor: color, sparkRadius: radius, sparkSize: size, duration: dur } = opts.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks.current = sparks.current.filter((s) => {
        const t = (now - s.start) / dur;
        if (t >= 1) return false;
        const eased = 1 - (1 - t) * (1 - t);
        const dist = eased * radius;
        const len = size * (1 - eased);
        const x1 = s.x + dist * Math.cos(s.angle);
        const y1 = s.y + dist * Math.sin(s.angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + len * Math.cos(s.angle), y1 + len * Math.sin(s.angle));
        ctx.stroke();
        return true;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = wrapRef.current!.getBoundingClientRect();
    const now = performance.now();
    for (let i = 0; i < sparkCount; i++) {
      sparks.current.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        angle: (2 * Math.PI * i) / sparkCount,
        start: now,
      });
    }
  };

  return (
    <div ref={wrapRef} onClick={onClick} className={`relative h-full min-h-[220px] w-full ${className}`}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
      <div className="flex h-full min-h-[220px] w-full items-center justify-center">
        {children ?? <span className="select-none text-sm text-white/50">Click anywhere in here</span>}
      </div>
    </div>
  );
}
