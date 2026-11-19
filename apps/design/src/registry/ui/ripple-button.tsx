"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type PointerEvent } from "react";

type Drop = { id: number; x: number; y: number; size: number };

/** Each press sends a ring of water out from the exact point you touched. */
export default function RippleButton({ label = "ส่งข้อความ" }: { label?: string }) {
  const [drops, setDrops] = useState<Drop[]>([]);

  const press = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    setDrops((d) => [...d, { id: e.timeStamp, x: e.clientX - r.left, y: e.clientY - r.top, size }]);
  };

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        onPointerDown={press}
        className="relative overflow-hidden rounded-lg bg-(--em-blue-600) px-8 py-4 font-semibold text-(--em-ink-0) transition-colors hover:bg-(--em-blue-500)"
      >
        <span className="relative z-10">{label}</span>
        <AnimatePresence>
          {drops.map((d) => (
            <motion.span
              key={d.id}
              aria-hidden
              className="absolute rounded-full bg-(--em-ink-0)/35"
              style={{
                left: d.x - d.size / 2,
                top: d.y - d.size / 2,
                width: d.size,
                height: d.size,
              }}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              onAnimationComplete={() => {
                setDrops((all) => all.filter((x) => x.id !== d.id));
              }}
            />
          ))}
        </AnimatePresence>
      </button>
    </div>
  );
}
