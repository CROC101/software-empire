"use client";

import { motion } from "motion/react";
import { useRef } from "react";

/**
 * A sticker whose bottom corner lifts when you point at it, showing its pale backing; drag it
 * anywhere in the frame. The fold grows from the corner with transform only.
 */
export default function PeelSticker({ peel = 34, drag = true }: { peel?: number; drag?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const corner = `${String(peel)}%`;
  return (
    <div
      ref={box}
      className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6"
    >
      <style>{`
        .peel-sticker .peel-fold { transform: scale(0); transform-origin: 100% 100%; transition: transform .35s cubic-bezier(.3,1.4,.5,1) }
        .peel-sticker:hover .peel-fold, .peel-sticker:focus-visible .peel-fold { transform: scale(1) }
        @media (prefers-reduced-motion: reduce) { .peel-sticker .peel-fold { transition: none } }
      `}</style>
      <motion.div
        drag={drag}
        dragConstraints={box}
        dragElastic={0.2}
        whileDrag={{ scale: 1.05, rotate: -4 }}
        tabIndex={0}
        aria-label="สติกเกอร์ ลากได้"
        className="peel-sticker relative size-40 cursor-grab touch-none outline-none active:cursor-grabbing"
      >
        <div className="grid size-full place-items-center rounded-xl bg-linear-to-b from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700) p-4 text-center">
          <p className="font-heading text-2xl font-black text-(--em-ink-0)">crocwork</p>
        </div>
        {/* the corner that lifted away shows the page behind it */}
        <span
          aria-hidden
          className="peel-fold absolute right-0 bottom-0 rounded-br-xl bg-(--em-ink-975)"
          style={{ width: corner, height: corner, clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
        />
        <span
          aria-hidden
          className="peel-fold absolute right-0 bottom-0 bg-linear-to-br from-(--em-ink-50) to-(--em-ink-300) shadow-[-2px_-2px_6px_var(--em-ink-975)]"
          style={{ width: corner, height: corner, clipPath: "polygon(0 0,100% 0,0 100%)" }}
        />
      </motion.div>
    </div>
  );
}
