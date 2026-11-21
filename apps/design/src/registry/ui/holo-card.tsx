"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/** A member card that tilts toward the pointer while a foil sheen slides across its face. */
export default function HoloCard({ tilt = 12 }: { tilt?: number }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), spring);
  const sheen = useSpring(useTransform(px, [0, 1], ["-35%", "35%"]), spring);
  return (
    <div
      className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6"
      style={{ perspective: 900 }}
    >
      <motion.div
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        style={{ rotateX, rotateY }}
        className="relative flex h-72 w-52 flex-col justify-between overflow-hidden rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) p-5"
      >
        <motion.span
          aria-hidden
          style={{ x: sheen }}
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-[200%] -skew-x-12 bg-linear-to-r from-transparent via-(--em-sky-400)/25 to-transparent"
        />
        <span className="relative font-mono text-xs text-(--em-ink-400)">CROC MEMBER</span>
        <div className="relative">
          <p className="text-2xl font-black text-(--em-ink-0)">สมาชิกทอง</p>
          <p className="mt-1 font-mono text-xs text-(--em-ink-400) tabular-nums">0042 · 2026</p>
        </div>
      </motion.div>
    </div>
  );
}
