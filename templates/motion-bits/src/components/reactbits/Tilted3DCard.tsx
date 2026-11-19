"use client";

import { useRef, useState, type ReactNode } from "react";

export interface Tilted3DCardProps {
  children?: ReactNode;
  maxTilt?: number;
  glareOpacity?: number;
  scaleOnHover?: number;
  width?: number;
  height?: number;
  title?: string;
  className?: string;
}

export default function Tilted3DCard({
  children,
  maxTilt = 14,
  glareOpacity = 0.35,
  scaleOnHover = 1.05,
  width = 280,
  height = 340,
  title = "Nebula 01",
  className = "",
}: Tilted3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hover: false });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setState({ rx: (0.5 - py) * 2 * maxTilt, ry: (px - 0.5) * 2 * maxTilt, gx: px * 100, gy: py * 100, hover: true });
  };

  return (
    <div style={{ perspective: 900 }} className={className}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setState({ rx: 0, ry: 0, gx: 50, gy: 50, hover: false })}
        className="relative overflow-hidden rounded-[18px] border border-white/10 will-change-transform"
        style={{
          width,
          height,
          transformStyle: "preserve-3d",
          transform: `rotateX(${state.rx}deg) rotateY(${state.ry}deg) scale(${state.hover ? scaleOnHover : 1})`,
          transition: state.hover ? "transform 0.08s linear" : "transform 0.5s cubic-bezier(.2,.8,.2,1)",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)",
        }}
      >
        {children ?? (
          <div className="flex h-full w-full flex-col justify-end bg-[radial-gradient(circle_at_30%_20%,#8b5cf6,transparent_55%),radial-gradient(circle_at_80%_70%,#06b6d4,transparent_50%),#120f17] p-5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-white/60">Collection</span>
            <span className="text-2xl font-semibold tracking-[-0.03em] text-white">{title}</span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: state.hover ? 1 : 0,
            transition: "opacity .3s",
            background: `radial-gradient(circle at ${state.gx}% ${state.gy}%, rgba(255,255,255,${glareOpacity}), transparent 60%)`,
            mixBlendMode: "overlay",
          }}
        />
      </div>
    </div>
  );
}
