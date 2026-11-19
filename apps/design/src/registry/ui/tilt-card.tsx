"use client";

import { Layers } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";

/** The card tilts toward the pointer in 3D; its badge and title float out on their own layers. */
export default function TiltCard({ max = 12 }: { max?: number }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6 [perspective:900px]">
      <motion.div
        onPointerMove={move}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative w-64 rounded-xl border border-(--em-ink-700) bg-linear-to-br from-(--em-ink-850) to-(--em-ink-950) p-6 shadow-2xl"
      >
        <div
          style={{ transform: "translateZ(50px)" }}
          className="mb-10 grid size-12 place-items-center rounded-lg bg-(--em-blue-600) text-(--em-ink-0)"
        >
          <Layers aria-hidden className="size-6" />
        </div>
        <h3
          style={{ transform: "translateZ(35px)" }}
          className="font-heading text-xl font-black text-(--em-ink-50)"
        >
          ชั้นลอยได้
        </h3>
        <p style={{ transform: "translateZ(20px)" }} className="mt-2 text-sm text-(--em-ink-300)">
          ขยับเมาส์บนการ์ด แต่ละชั้นลอยไม่เท่ากัน
        </p>
      </motion.div>
    </div>
  );
}
