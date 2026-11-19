"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const blobs = [
  {
    color: "var(--em-blue-500)",
    at: "-left-[15%] -top-[25%]",
    x: [0, 90, -40, 0],
    y: [0, 50, 90, 0],
  },
  {
    color: "var(--em-sky-400)",
    at: "-right-[20%] top-[5%]",
    x: [0, -70, 30, 0],
    y: [0, 70, -30, 0],
  },
  {
    color: "var(--em-violet-500)",
    at: "left-[15%] -bottom-[35%]",
    x: [0, 60, -80, 0],
    y: [0, -60, 20, 0],
  },
];

/** Three drifting aurora layers over ink, with an optional rotating liquid-metal disc behind. */
export function AuroraTide({
  title = "แสงใต้น้ำ",
  speed = 16,
  blur = 80,
  intensity = 0.65,
  swirl = true,
  children,
}: {
  title?: string;
  speed?: number;
  blur?: number;
  intensity?: number;
  swirl?: boolean;
  /** replaces the title, so a page hero can sit on the same water */
  children?: ReactNode;
}) {
  return (
    <div className="relative isolate flex size-full min-h-56 items-center justify-center overflow-hidden bg-(--em-ink-975)">
      {swirl && (
        <motion.div
          aria-hidden
          className="vt-live absolute top-1/2 left-1/2 -z-10 aspect-square w-[130%] -translate-1/2 rounded-full opacity-25"
          style={{
            background:
              "conic-gradient(from 0deg, var(--em-ink-975), var(--em-blue-600), var(--em-ink-200), var(--em-ink-900), var(--em-sky-400), var(--em-ink-975))",
            filter: `blur(${blur / 2}px)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: speed * 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      {blobs.map((b, i) => (
        <motion.div
          key={b.color}
          aria-hidden
          className={`vt-live absolute -z-10 aspect-square w-[70%] rounded-full ${b.at}`}
          style={{
            background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
            filter: `blur(${blur}px)`,
            opacity: intensity,
          }}
          animate={{ x: b.x, y: b.y, scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: speed + i * 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* faint grain: a static dot pattern, no SVG noise filter */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(var(--em-ink-400)_0.5px,transparent_0.5px)] [background-size:3px_3px]"
      />
      {children ?? (
        <h3 className="px-6 text-center font-heading text-4xl font-black text-(--em-ink-50) sm:text-5xl">
          {title}
        </h3>
      )}
    </div>
  );
}

export default AuroraTide;
