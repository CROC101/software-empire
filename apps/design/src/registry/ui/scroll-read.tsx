"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

function Word({ w, i, n, p }: { w: string; i: number; n: number; p: MotionValue<number> }) {
  const opacity = useTransform(p, [i / n, (i + 1) / n], [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {w}&nbsp;
    </motion.span>
  );
}

/**
 * A paragraph that lights up as you read: each word brightens in turn as you scroll the panel, so
 * the eye always knows where it is.
 */
export default function ScrollRead({
  text = "ทุกคำค่อยๆ สว่างขึ้นตามจังหวะที่คุณเลื่อน อ่านไปพร้อมกัน ไม่ต้องรีบ ไม่มีอะไรหลุดสายตา",
}: {
  text?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    container: box,
    target,
    offset: ["start 0.9", "end 0.5"],
  });
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div
      ref={box}
      tabIndex={0}
      aria-label="เลื่อนลงในกรอบนี้"
      className="size-full max-h-[28rem] min-h-56 overflow-y-auto bg-(--em-ink-975) px-6"
    >
      <p className="grid h-48 place-items-center text-sm text-(--em-ink-500)">เลื่อนลง</p>
      <p
        ref={target}
        className="mx-auto max-w-2xl font-heading text-3xl leading-snug font-black text-(--em-ink-50) sm:text-4xl"
      >
        {words.map((w, i) => (
          <Word key={i} w={w} i={i} n={words.length} p={scrollYProgress} />
        ))}
      </p>
      <div className="h-64" />
    </div>
  );
}
