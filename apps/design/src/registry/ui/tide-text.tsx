"use client";

import { motion } from "motion/react";
import { useId, type CSSProperties } from "react";

/** Two waves twice the box width, so sliding by half loops without a seam. */
const wave = (y: number, amp: number) => {
  let d = `M0 ${y}`;
  for (let i = 0; i < 8; i++) d += ` q50 ${i % 2 ? amp : -amp} 100 0`;
  return `${d} V200 H0 Z`;
};

/** Outline letters fill with water from below; the water surface keeps lapping once it is full. */
export default function TideText({
  text = "TIDE",
  duration = 4,
}: {
  text?: string;
  duration?: number;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes tide-text-lap{to{transform:translateX(-400px)}}.tide-text-w{animation:tide-text-lap var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.tide-text-w{animation:none}}`}</style>
      <svg viewBox="0 0 400 140" role="img" aria-label={text} className="w-full max-w-xl">
        <defs>
          <clipPath id={`c${id}`}>
            <text
              x="200"
              y="112"
              textAnchor="middle"
              fontSize="120"
              fontWeight="900"
              className="font-heading"
            >
              {text}
            </text>
          </clipPath>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <motion.g
            initial={{ y: 130 }}
            animate={{ y: 10 }}
            transition={{ duration, ease: [0.3, 0, 0.2, 1] }}
          >
            <path
              className="tide-text-w vt-live"
              style={{ "--t": "4s" } as CSSProperties}
              d={wave(20, 8)}
              fill="var(--em-blue-500)"
            />
            <path
              className="tide-text-w vt-live"
              style={{ "--t": "6s", animationDirection: "reverse" } as CSSProperties}
              d={wave(26, 6)}
              fill="var(--em-sky-400)"
              opacity={0.6}
            />
          </motion.g>
        </g>
        <text
          x="200"
          y="112"
          textAnchor="middle"
          fontSize="120"
          fontWeight="900"
          fill="none"
          stroke="var(--em-sky-400)"
          strokeWidth="1.5"
          className="font-heading"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
