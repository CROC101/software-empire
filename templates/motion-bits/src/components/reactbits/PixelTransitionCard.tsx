"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface PixelTransitionCardProps {
  firstContent?: ReactNode;
  secondContent?: ReactNode;
  gridSize?: number;
  pixelColor?: string;
  animationDuration?: number;
  width?: number;
  height?: number;
  className?: string;
}

// Seeded shuffle so server and client render the same pixel order.
function delays(count: number) {
  let seed = count * 9301 + 49297;
  return Array.from({ length: count }, () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  });
}

export default function PixelTransitionCard({
  firstContent,
  secondContent,
  gridSize = 9,
  pixelColor = "#ffffff",
  animationDuration = 0.4,
  width = 280,
  height = 280,
  className = "",
}: PixelTransitionCardProps) {
  const [covering, setCovering] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const target = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const order = useMemo(() => delays(gridSize * gridSize), [gridSize]);
  const half = (animationDuration * 1000) / 2;

  const go = (second: boolean) => {
    if (target.current === second) return;
    target.current = second;
    if (timer.current) clearTimeout(timer.current);
    setCovering(true);
    timer.current = setTimeout(() => {
      setShowSecond(second);
      setCovering(false);
    }, half);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0b13] ${className}`}
      style={{ width, height }}
      onMouseEnter={() => go(true)}
      onMouseLeave={() => go(false)}
      onClick={() => go(!target.current)}
    >
      <div className="absolute inset-0">
        {showSecond
          ? secondContent ?? (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#8b5cf6,#06b6d4)] text-3xl font-semibold tracking-[-0.03em] text-white">
                Hello!
              </div>
            )
          : firstContent ?? (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_30%,#2a2333,#0e0b13)] text-white">
                <span className="text-5xl">✦</span>
                <span className="text-sm text-white/60">Hover me</span>
              </div>
            )}
      </div>
      <div
        className="pointer-events-none absolute inset-0 grid"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
      >
        {order.map((d, i) => (
          <div
            key={i}
            style={{
              backgroundColor: pixelColor,
              opacity: covering ? 1 : 0,
              transition: `opacity 0s linear ${(d * half) / 1000}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
