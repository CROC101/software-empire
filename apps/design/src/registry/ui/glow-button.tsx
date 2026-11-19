"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import type { PointerEvent } from "react";

/** Light pools under the pointer: a soft glow behind the button and a bright rim where the pointer is. */
export default function GlowButton({ label = "เริ่มใช้ฟรี" }: { label?: string }) {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const rim = useMotionTemplate`radial-gradient(120px circle at ${x}% ${y}%, var(--em-sky-400), transparent 60%)`;

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 100);
    y.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        onPointerMove={move}
        className="group relative rounded-lg p-px font-semibold text-(--em-ink-50) transition-transform duration-75 active:scale-[0.98]"
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-lg bg-(--em-ink-700)"
          style={{ backgroundImage: rim }}
        />
        <span className="relative block rounded-[calc(0.5rem-1px)] bg-(--em-ink-900) px-8 py-3.5 transition-colors duration-75 group-hover:bg-(--em-ink-850)">
          {label}
        </span>
      </button>
    </div>
  );
}
