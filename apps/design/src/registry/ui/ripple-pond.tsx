"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Splash = { id: number; x: number; y: number };

/** Touch the water: each tap sends out three rings that widen and fade (about 1.4 s, the house reaction speed). */
export default function RipplePond() {
  const [splashes, setSplashes] = useState<Splash[]>([]);
  return (
    <div
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const s = { id: e.timeStamp, x: e.clientX - r.left, y: e.clientY - r.top };
        setSplashes((all) => [...all.slice(-5), s]);
      }}
      className="relative grid size-full min-h-72 cursor-pointer place-items-center overflow-hidden bg-linear-to-b from-(--em-blue-700) to-(--em-ink-975) p-6"
    >
      <p className="pointer-events-none text-sm text-(--em-ink-100)/70">แตะผิวน้ำ</p>
      <AnimatePresence>
        {splashes.map((s) =>
          [0, 1, 2].map((k) => (
            <motion.span
              key={`${String(s.id)}-${String(k)}`}
              aria-hidden
              className="pointer-events-none absolute size-24 rounded-full border-2 border-(--em-sky-400)"
              style={{ left: s.x - 48, top: s.y - 48 }}
              initial={{ scale: 0.1, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.4, delay: k * 0.18, ease: "easeOut" }}
              onAnimationComplete={() => {
                if (k === 2) setSplashes((all) => all.filter((x) => x.id !== s.id));
              }}
            />
          )),
        )}
      </AnimatePresence>
    </div>
  );
}
