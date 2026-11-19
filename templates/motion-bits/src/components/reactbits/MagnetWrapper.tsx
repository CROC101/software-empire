"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MagnetWrapperProps {
  children?: ReactNode;
  padding?: number;
  magnetStrength?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function MagnetWrapper({
  children,
  padding = 100,
  magnetStrength = 3,
  disabled = false,
  label = "Pull me closer",
  className = "",
}: MagnetWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (disabled) {
      setOffset({ x: 0, y: 0, active: false });
      return;
    }
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const inside =
        Math.abs(e.clientX - cx) < r.width / 2 + padding &&
        Math.abs(e.clientY - cy) < r.height / 2 + padding;
      setOffset(
        inside
          ? { x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength, active: true }
          : { x: 0, y: 0, active: false },
      );
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [padding, magnetStrength, disabled]);

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      <div
        className="will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: offset.active ? "transform 0.3s ease-out" : "transform 0.6s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {children ?? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(168,85,247,.6)]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
