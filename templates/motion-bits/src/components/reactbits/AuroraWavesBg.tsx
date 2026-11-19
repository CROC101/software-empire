"use client";

import { motion } from "framer-motion";

export interface AuroraWavesBgProps {
  colorA?: string;
  colorB?: string;
  colorC?: string;
  baseColor?: string;
  blendSpeed?: number;
  amplitude?: number;
  blur?: number;
  className?: string;
}

// Each layer is a large blurred gradient moved with GPU-composited transforms only.
const LAYERS = [
  { left: "-20%", top: "10%", w: "90%", h: "80%", x: [0, 18, -6, 0], y: [0, -10, 8, 0], r: [0, 10, -6, 0], t: 1 },
  { left: "25%", top: "-25%", w: "85%", h: "85%", x: [0, -14, 10, 0], y: [0, 14, -6, 0], r: [0, -12, 8, 0], t: 1.3 },
  { left: "5%", top: "45%", w: "110%", h: "75%", x: [0, 10, -16, 0], y: [0, -8, 6, 0], r: [0, 6, -10, 0], t: 1.7 },
];

export default function AuroraWavesBg({
  colorA = "#5b21b6",
  colorB = "#a855f7",
  colorC = "#e9d5ff",
  baseColor = "#0e0b13",
  blendSpeed = 1,
  amplitude = 1,
  blur = 60,
  className = "",
}: AuroraWavesBgProps) {
  const colors = [colorA, colorB, colorC];
  const s = Math.max(blendSpeed, 0.05);
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} style={{ background: baseColor }}>
      {LAYERS.map((l, i) => (
        <motion.div
          key={i}
          className="absolute rounded-[50%] will-change-transform"
          style={{
            left: l.left,
            top: l.top,
            width: l.w,
            height: l.h,
            background: `radial-gradient(closest-side, ${colors[i]}, transparent)`,
            filter: `blur(${blur}px)`,
            mixBlendMode: "screen",
            opacity: 0.9,
          }}
          animate={{
            x: l.x.map((v) => `${v * amplitude}%`),
            y: l.y.map((v) => `${v * amplitude}%`),
            rotate: l.r.map((v) => v * amplitude),
          }}
          transition={{ duration: (14 * l.t) / s, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
