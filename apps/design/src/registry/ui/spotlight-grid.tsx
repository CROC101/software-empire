"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { Code2, Layers, Palette, Rocket, Shield, Zap } from "lucide-react";

const tiles = [
  { t: "ออกแบบ", i: Palette },
  { t: "เขียนโค้ด", i: Code2 },
  { t: "ปลอดภัย", i: Shield },
  { t: "เร็ว", i: Zap },
  { t: "เป็นระบบ", i: Layers },
  { t: "ขึ้นจริง", i: Rocket },
];

/** A dark grid lit only around the pointer, like a flashlight; the hairlines between tiles glow inside the beam. */
export default function SpotlightGrid() {
  const x = useMotionValue(-999);
  const y = useMotionValue(-999);
  const light = useMotionTemplate`radial-gradient(180px circle at ${x}px ${y}px, var(--em-sky-400), transparent 70%)`;
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left);
          y.set(e.clientY - r.top);
        }}
        onPointerLeave={() => {
          x.set(-999);
          y.set(-999);
        }}
        className="relative grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl bg-(--em-ink-800)"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: light }}
        />
        {tiles.map(({ t, i: Icon }) => (
          <div
            key={t}
            className="relative flex flex-col items-center gap-2 bg-(--em-ink-950) px-3 py-6"
          >
            <Icon aria-hidden className="size-6 text-(--em-ink-300)" />
            <span className="text-sm text-(--em-ink-200)">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
