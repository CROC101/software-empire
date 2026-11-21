"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

const SIZE = 120;

/** A drop of glass that trails the pointer over a headline; the words under it swell as if seen through water. */
export default function WaterLens({ zoom = 1.5 }: { zoom?: number }) {
  const x = useMotionValue(120);
  const y = useMotionValue(60);
  const sx = useSpring(x, { stiffness: 160, damping: 18 });
  const sy = useSpring(y, { stiffness: 160, damping: 18 });
  // the copy inside the lens is moved opposite to the lens so it stays lined up with the page copy
  const ix = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });
  const iy = useSpring(useMotionValue(0), { stiffness: 160, damping: 18 });
  const copy = (
    <p className="w-80 text-4xl leading-tight font-black text-(--em-ink-0)">
      เว็บที่ลื่นเหมือนน้ำ อ่านง่ายทุกจอ
    </p>
  );
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        className="relative w-80"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = e.clientX - r.left;
          const py = e.clientY - r.top;
          x.set(px - SIZE / 2);
          y.set(py - SIZE / 2);
          ix.set(-px * zoom + SIZE / 2);
          iy.set(-py * zoom + SIZE / 2);
        }}
      >
        {copy}
        <motion.div
          aria-hidden
          style={{ x: sx, y: sy, width: SIZE, height: SIZE }}
          className="pointer-events-none absolute top-0 left-0 overflow-hidden rounded-full border border-(--em-sky-400)/50 bg-(--em-blue-900)"
        >
          <motion.div style={{ x: ix, y: iy, scale: zoom }} className="origin-top-left">
            {copy}
          </motion.div>
          <span className="absolute inset-x-6 top-2 h-3 rounded-full bg-(--em-ink-0)/25 blur-sm" />
        </motion.div>
      </div>
    </div>
  );
}
