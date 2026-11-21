"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Scroll inside the box: a small framed picture grows until it fills the width, then the page
 * carries on. Driven by the box's own scroll position, scale only; reduced motion shows it full size.
 */
export default function WidenFrame({
  from = 0.45,
  track = 250,
}: {
  from?: number;
  track?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({
    container: box,
    target: stage,
    offset: ["start start", "end end"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.8], [from, 1]);
  const words = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);

  return (
    <div
      ref={box}
      className="relative size-full min-h-72 overflow-y-auto overscroll-contain bg-(--em-ink-975)"
      style={{ containerType: "size" }}
    >
      <div className="grid h-[100cqh] place-content-center gap-2 p-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">scroll</p>
        <p className="font-heading text-3xl font-black text-(--em-ink-50)">เลื่อนลงในกรอบนี้</p>
      </div>
      <div ref={stage} className="relative" style={{ height: `${String(track)}cqh` }}>
        <div className="sticky top-0 grid h-[100cqh] place-items-center overflow-hidden p-4">
          <motion.figure
            style={{ scale: still ? 1 : scale }}
            className="relative size-full overflow-hidden rounded-xl bg-linear-to-b from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700)"
          >
            <span className="absolute top-[18%] right-[20%] size-12 rounded-full bg-(--em-ink-50)" />
            <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-(--em-blue-800) to-(--em-ink-975)" />
            <motion.figcaption
              style={{ opacity: still ? 1 : words }}
              className="absolute inset-x-0 bottom-0 p-6 font-heading text-3xl font-black text-(--em-ink-0)"
            >
              เต็มจอเมื่อถึงที่
            </motion.figcaption>
          </motion.figure>
        </div>
      </div>
      <p className="p-6 text-center text-sm text-(--em-ink-400)">จบภาพแล้วหน้าเลื่อนต่อตามปกติ</p>
    </div>
  );
}
