"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

/** A card whose 1px border lights up only where the pointer is near, as if a lamp passed along the edge. */
export default function EdgeLightCard({ size = 180 }: { size?: number }) {
  const x = useMotionValue(-999);
  const y = useMotionValue(-999);
  const sx = useSpring(x, { stiffness: 500, damping: 40 });
  const sy = useSpring(y, { stiffness: 500, damping: 40 });
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left - size / 2);
          y.set(e.clientY - r.top - size / 2);
        }}
        onPointerLeave={() => {
          x.set(-999);
          y.set(-999);
        }}
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-(--em-ink-800) p-px"
      >
        <motion.span
          aria-hidden
          style={{ x: sx, y: sy, width: size, height: size }}
          className="pointer-events-none absolute top-0 left-0 rounded-full bg-(--em-sky-400) blur-2xl"
        />
        <div className="relative rounded-[calc(0.75rem-1px)] bg-(--em-ink-900) p-6">
          <p className="font-mono text-xs text-(--em-ink-400)">แพ็กเกจ</p>
          <h3 className="mt-2 text-2xl font-black text-(--em-ink-0)">เว็บร้านค้า</h3>
          <p className="mt-2 text-sm text-(--em-ink-300)">
            หน้าร้าน ตะกร้า ชำระเงินพร้อมเพย์ ส่งงานใน 3 สัปดาห์
          </p>
        </div>
      </div>
    </div>
  );
}
