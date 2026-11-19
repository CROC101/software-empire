"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useState } from "react";

/** A soft blob trails the pointer on a spring and swells when it passes over something you can press. */
export default function CursorBlob() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 300, damping: 28 });
  const sy = useSpring(y, { stiffness: 300, damping: 28 });
  const [big, setBig] = useState(false);
  const [inside, setInside] = useState(false);
  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
        setBig(Boolean((e.target as HTMLElement).closest("button")));
      }}
      onPointerEnter={() => {
        setInside(true);
      }}
      onPointerLeave={() => {
        setInside(false);
      }}
      className="relative flex size-full min-h-72 flex-col items-center justify-center gap-4 overflow-hidden bg-(--em-ink-975) p-6"
    >
      <p className="text-sm text-(--em-ink-300)">ลองขยับเมาส์ไปบนปุ่ม</p>
      <div className="flex gap-3">
        {["ดูผลงาน", "ติดต่อ"].map((t) => (
          <button
            key={t}
            type="button"
            className="rounded-lg border border-(--em-ink-700) px-5 py-2.5 font-semibold text-(--em-ink-50)"
          >
            {t}
          </button>
        ))}
      </div>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 size-10 rounded-full bg-(--em-sky-400) mix-blend-difference motion-reduce:hidden"
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: big ? 2.2 : 1, opacity: inside ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </div>
  );
}
