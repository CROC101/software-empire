"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent } from "react";

/** The button leans toward the pointer and springs back when it leaves. The label leans a little further. */
export default function MagneticButton({
  label = "แตะเลย",
  strength = 0.3,
}: {
  label?: string;
  strength?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 15, mass: 0.4 });

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <motion.button
        type="button"
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: 0.94 }}
        className="rounded-lg bg-(--em-blue-600) px-8 py-4 font-semibold text-(--em-ink-0) shadow-lg"
      >
        <motion.span className="inline-block" style={{ x: sx, y: sy }}>
          {label}
        </motion.span>
      </motion.button>
    </div>
  );
}
