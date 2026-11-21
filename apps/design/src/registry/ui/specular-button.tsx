"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

/** A dark glass button with a soft highlight that slides under the pointer, like light on a polished face. */
export default function SpecularButton({ label = "เริ่มโปรเจกต์" }: { label?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 400, damping: 40 });
  const sy = useSpring(y, { stiffness: 400, damping: 40 });
  const glow = useSpring(0, { stiffness: 300, damping: 30 });
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left - 40);
          y.set(e.clientY - r.top - 40);
        }}
        onPointerEnter={() => {
          glow.set(1);
        }}
        onPointerLeave={() => {
          glow.set(0);
        }}
        className="relative overflow-hidden rounded-lg border border-(--em-ink-600) bg-(--em-ink-850) px-8 py-4 text-base font-semibold text-(--em-ink-0) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
      >
        <motion.span
          aria-hidden
          style={{ x: sx, y: sy, opacity: glow }}
          className="pointer-events-none absolute top-0 left-0 size-20 rounded-full bg-(--em-ink-0)/20 blur-xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 h-px bg-(--em-ink-0)/30"
        />
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}
