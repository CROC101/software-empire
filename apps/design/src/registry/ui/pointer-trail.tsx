"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

type Drop = { id: number; x: number; y: number };

/** Drops of light fall from the pointer as it moves and fade away; at most 24 live at once. */
export default function PointerTrail() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const last = useRef(0);
  const n = useRef(0);
  const still = useReducedMotion();
  return (
    <div
      onPointerMove={(e) => {
        if (still || e.timeStamp - last.current < 24) return;
        last.current = e.timeStamp;
        const r = e.currentTarget.getBoundingClientRect();
        n.current += 1;
        const d = { id: n.current, x: e.clientX - r.left, y: e.clientY - r.top };
        setDrops((all) => [...all.slice(-23), d]);
      }}
      className="relative grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6"
    >
      <p className="pointer-events-none text-sm text-(--em-ink-400)">ลากเมาส์ผ่านพื้นที่นี้</p>
      <AnimatePresence>
        {drops.map((d) => (
          <motion.span
            key={d.id}
            aria-hidden
            className="pointer-events-none absolute size-3 rounded-full bg-(--em-sky-400)"
            style={{ left: d.x - 6, top: d.y - 6 }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 0.2, y: 18 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => {
              setDrops((all) => all.filter((x) => x.id !== d.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
