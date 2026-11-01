"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * 36 thin curves sweeping across the panel, each tracing itself slowly forever. Colour comes from
 * currentColor (the panel's foreground token). Reduced motion or LITE: the curves stand still.
 */
export function FloatingPaths({ position }: { position: 1 | -1 }) {
  const still = useReducedMotion() === true;
  const paths = Array.from({ length: 36 }, (_, i) => {
    const x = (n: number) => n - i * 5 * position;
    return {
      id: i,
      d: `M-${String(x(380))} -${String(189 + i * 6)}C-${String(x(380))} -${String(189 + i * 6)} -${String(x(312))} ${String(216 - i * 6)} ${String(x(152))} ${String(343 - i * 6)}C${String(x(616))} ${String(470 - i * 6)} ${String(x(684))} ${String(875 - i * 6)} ${String(x(684))} ${String(875 - i * 6)}`,
      width: 0.5 + i * 0.03,
      // deterministic, so server and client draw the same thing
      duration: 20 + ((i * 7) % 10),
    };
  });

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full text-foreground"
      viewBox="0 0 696 316"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={0.1 + path.id * 0.03}
          initial={{ pathLength: 0.3, opacity: 0.6 }}
          animate={
            still
              ? { pathLength: 1, opacity: 0.45 }
              : { pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }
          }
          transition={
            still ? { duration: 0 } : { duration: path.duration, repeat: Infinity, ease: "linear" }
          }
        />
      ))}
    </svg>
  );
}
