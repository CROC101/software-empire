"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";

type Shot = { id: number; x: number; y: number };

/** Pull the button back like a slingshot and let go: it snaps home and fires a drop the other way. */
export default function SlingButton({ power = 1 }: { power?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [hits, setHits] = useState(0);
  const n = useRef(0);
  const fire = (x: number, y: number) => {
    setShots((s) => [...s.slice(-5), { id: n.current++, x: x * 3 * power, y: y * 3 * power }]);
    setHits((h) => h + 1);
  };
  return (
    <div className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div ref={box} className="relative grid size-56 place-items-center">
        {shots.map((s) => (
          <motion.span
            key={s.id}
            aria-hidden
            className="absolute size-3 rounded-full bg-(--em-sky-400)"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: s.x, y: s.y, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => {
              setShots((all) => all.filter((o) => o.id !== s.id));
            }}
          />
        ))}
        <motion.button
          type="button"
          drag
          dragConstraints={box}
          dragElastic={0.4}
          dragSnapToOrigin
          dragTransition={{ bounceStiffness: 600, bounceDamping: 12 }}
          onDragEnd={(_, info) => {
            fire(-info.offset.x, -info.offset.y);
          }}
          onClick={(e) => {
            // keyboard and plain clicks fire straight up
            if (e.detail === 0) fire(0, -40);
          }}
          whileDrag={{ scale: 0.92 }}
          className="relative z-10 cursor-grab touch-none rounded-lg bg-(--em-blue-600) px-5 py-3 text-sm font-semibold text-(--em-ink-0) active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-sky-400)"
        >
          ดึงแล้วปล่อย
        </motion.button>
        <span
          className="absolute bottom-0 font-mono text-xs text-(--em-ink-500) tabular-nums"
          aria-live="polite"
        >
          ยิงแล้ว {hits}
        </span>
      </div>
    </div>
  );
}
