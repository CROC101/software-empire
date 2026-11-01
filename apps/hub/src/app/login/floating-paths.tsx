"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * 24 thin curves sweeping across the panel, each tracing itself slowly forever. Colour comes from
 * currentColor (the panel's foreground token). Reduced motion or LITE: the curves stand still.
 */
export function FloatingPaths({ position }: { position: 1 | -1 }) {
  const still = useReducedMotion() === true;
  // 24 curves spread over the span the original 36 covered: half the paint work per frame
  const paths = Array.from({ length: 24 }, (_, n) => {
    const i = Math.round(n * 1.5);
    const x = (v: number) => v - i * 5 * position;
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
      // the curves run from above the top-left corner to y=875: frame all of them, not a strip
      viewBox="0 0 696 875"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          // fixed opacity: animating it per path gives every curve its own GPU layer, and 72 of
          // them blanked the whole page in Edge
          strokeOpacity={(0.1 + path.id * 0.03) * 0.5}
          initial={{ pathLength: 0.3 }}
          animate={still ? { pathLength: 1 } : { pathLength: 1, pathOffset: [0, 1, 0] }}
          transition={
            still ? { duration: 0 } : { duration: path.duration, repeat: Infinity, ease: "linear" }
          }
        />
      ))}
    </svg>
  );
}
