"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent } from "react";

/** A sheen of light slides across the card's face, following the pointer like a holographic foil. */
export default function GlareCard() {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(260px circle at ${sx}% ${sy}%, color-mix(in oklab, var(--em-ink-0) 35%, transparent), transparent 60%)`;
  const foil = useMotionTemplate`linear-gradient(${sx}deg, transparent 20%, color-mix(in oklab, var(--em-sky-400) 25%, transparent) 45%, color-mix(in oklab, var(--em-violet-400) 25%, transparent) 55%, transparent 80%)`;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 100);
    y.set(((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        onPointerMove={move}
        className="relative aspect-[5/7] w-56 overflow-hidden rounded-xl border border-(--em-ink-700) bg-linear-to-br from-(--em-blue-800) to-(--em-ink-950) p-5"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 mix-blend-screen"
          style={{ backgroundImage: foil }}
        />
        <motion.div aria-hidden className="absolute inset-0" style={{ backgroundImage: glare }} />
        <div className="relative flex h-full flex-col justify-between">
          <span className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
            Rare · 01
          </span>
          <div>
            <p className="font-heading text-2xl font-black text-(--em-ink-50)">การ์ดสะท้อนแสง</p>
            <p className="text-sm text-(--em-ink-300)">ชี้แล้วลากไปมา</p>
          </div>
        </div>
      </div>
    </div>
  );
}
