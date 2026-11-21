"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const steps = ["อ่านคำถาม", "ค้นข้อมูลที่เกี่ยวข้อง", "เรียบเรียงคำตอบ"];

/** A "thinking" line: light sweeps across the words while the steps tick in one after another. */
export default function ThoughtLine({
  text = "กำลังคิด",
  speed = 1.4,
}: {
  text?: string;
  speed?: number;
}) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => {
      setN((v) => (v % (steps.length + 1)) + 1);
    }, speed * 1000);
    return () => {
      clearInterval(t);
    };
  }, [speed]);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-64" role="status">
        <p className="relative overflow-hidden text-lg font-semibold text-(--em-ink-300)">
          {text}
          <motion.span
            aria-hidden
            className="vt-live absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-(--em-sky-400)/35 to-transparent"
            animate={{ x: ["-100%", "220%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </p>
        <ol className="mt-3 flex flex-col gap-1.5">
          {steps.slice(0, Math.min(n, steps.length)).map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-(--em-ink-400)"
            >
              <span
                className={`size-1.5 rounded-full ${i === n - 1 ? "bg-(--em-sky-400)" : "bg-(--em-ink-600)"}`}
              />
              {s}
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
