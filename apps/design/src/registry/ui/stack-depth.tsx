"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * The word is a solid block: copies stacked back in depth make its sides, and the block tilts
 * toward the pointer. Still under reduced motion.
 */
export default function StackDepth({
  text = "DEPTH",
  layers = 10,
  tilt = 24,
}: {
  text?: string;
  layers?: number;
  tilt?: number;
}) {
  const still = useReducedMotionAfterMount();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [tilt, -tilt]), {
    stiffness: 120,
    damping: 14,
  });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-tilt, tilt]), {
    stiffness: 120,
    damping: 14,
  });
  return (
    <div
      className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 [perspective:900px]"
      onPointerMove={(e) => {
        if (still) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.p
        aria-label={text}
        style={{ rotateX: rx, rotateY: ry }}
        className="relative grid font-heading text-6xl font-black [transform-style:preserve-3d] sm:text-8xl"
      >
        {Array.from({ length: layers }, (_, i) => layers - i).map((d) => (
          <span
            key={d}
            aria-hidden
            className="col-start-1 row-start-1 text-(--em-blue-800)"
            style={{ transform: `translateZ(${-d * 3}px)`, opacity: 1 - d / (layers * 1.6) }}
          >
            {text}
          </span>
        ))}
        <span aria-hidden className="col-start-1 row-start-1 text-(--em-ink-50)">
          {text}
        </span>
      </motion.p>
    </div>
  );
}
