"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

type Drop = { id: number; x: number; y: number };

/** Move across the panel and it leaves a short trail of a word or symbol that fades and sinks. */
export default function TrailCursor({
  text = "◆",
  spacing = 28,
  max = 14,
}: {
  text?: string;
  spacing?: number;
  max?: number;
}) {
  const still = useReducedMotionAfterMount();
  const [drops, setDrops] = useState<Drop[]>([]);
  const last = useRef({ x: -1e4, y: -1e4, id: 0 });
  return (
    <div
      className="relative grid size-full min-h-56 touch-none place-items-center overflow-hidden bg-(--em-ink-975) p-6"
      onPointerMove={(e) => {
        if (still) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const l = last.current;
        if (Math.hypot(x - l.x, y - l.y) < spacing) return;
        l.x = x;
        l.y = y;
        l.id += 1;
        const id = l.id;
        setDrops((d) => [...d.slice(-(max - 1)), { id, x, y }]);
      }}
    >
      <p className="pointer-events-none text-sm text-(--em-ink-500)">ลากเมาส์หรือนิ้วผ่าน</p>
      <AnimatePresence>
        {drops.map((d) => (
          <motion.span
            key={d.id}
            aria-hidden
            className="pointer-events-none absolute -translate-1/2 font-heading text-2xl font-black text-(--em-blue-400)"
            style={{ left: d.x, top: d.y }}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: 0, scale: 0.4, y: 18 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => {
              setDrops((all) => all.filter((x) => x.id !== d.id));
            }}
          >
            {text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
