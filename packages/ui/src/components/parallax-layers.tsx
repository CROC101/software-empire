"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "../lib/cn";

export type ParallaxLayer = {
  /** how far the layer sinks while the section scrolls past, % of its height (0 = pinned to page) */
  depth: number;
  node: ReactNode;
  className?: string;
};

/**
 * Layered depth header: every layer is stacked in the same box and sinks at its own speed as
 * the section scrolls out, so far layers lag behind near ones. Later layers paint on top.
 * Native scrolling stays untouched (no smooth-scroll hijack); reduced motion = flat, static.
 */
export function ParallaxLayers({
  layers,
  className,
  children,
}: {
  layers: ParallaxLayer[];
  className?: string;
  /** content that scrolls normally below the layered header */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // 0 when the header top hits the viewport top, 1 when its bottom does
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  return (
    <div>
      <div ref={ref} className={cn("relative h-[80svh] min-h-[32rem] overflow-hidden", className)}>
        {layers.map((layer, i) => (
          <Layer
            key={i}
            progress={scrollYProgress}
            depth={reduced ? 0 : layer.depth}
            className={layer.className}
          >
            {layer.node}
          </Layer>
        ))}
        {/* fade into the page so the bottom edge never looks cut */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-t from-background to-transparent" />
      </div>
      {children}
    </div>
  );
}

function Layer({
  progress,
  depth,
  className,
  children,
}: {
  progress: MotionValue<number>;
  depth: number;
  className?: string;
  children: ReactNode;
}) {
  const y = useTransform(progress, [0, 1], ["0%", `${String(depth)}%`]);
  return (
    <motion.div style={{ y }} className={cn("absolute inset-0 will-change-transform", className)}>
      {children}
    </motion.div>
  );
}
