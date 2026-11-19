"use client";

import { motion } from "motion/react";
import { useState } from "react";

const tasks = ["ออกแบบหน้าแรก", "ทดสอบบนมือถือ", "ส่งให้ลูกค้าดู"];

/** Checkboxes whose tick draws itself and whose box pops with a ring. Native inputs underneath. */
export default function CheckPop() {
  const [done, setDone] = useState<boolean[]>([true, false, false]);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <ul className="flex flex-col gap-3">
        {tasks.map((t, i) => {
          const on = done[i] ?? false;
          return (
            <li key={t}>
              <label className="flex cursor-pointer items-center gap-3 text-(--em-ink-100)">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    setDone(done.map((d, j) => (j === i ? !d : d)));
                  }}
                  className="peer sr-only"
                />
                <motion.span
                  animate={{ scale: on ? [1, 0.8, 1.1, 1] : 1 }}
                  transition={{ duration: 0.35 }}
                  className={`relative grid size-6 place-items-center rounded-md border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--em-sky-400) ${on ? "border-(--em-blue-500) bg-(--em-blue-500)" : "border-(--em-ink-500)"}`}
                >
                  {on && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-md border-2 border-(--em-sky-400)"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.9, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  <svg viewBox="0 0 24 24" aria-hidden className="size-4">
                    <motion.path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke="var(--em-ink-0)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: on ? 1 : 0 }}
                      transition={{ duration: 0.25, delay: on ? 0.08 : 0 }}
                    />
                  </svg>
                </motion.span>
                <span className={`transition-opacity ${on ? "line-through opacity-50" : ""}`}>
                  {t}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
