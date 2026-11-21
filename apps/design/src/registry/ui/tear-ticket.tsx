"use client";

import { motion } from "motion/react";
import { useState } from "react";

/** A ticket whose stub tears off along the perforation and falls away; the body gives a small jolt. */
export default function TearTicket({ label = "CROC LIVE" }: { label?: string }) {
  const [torn, setTorn] = useState(false);
  return (
    <div className="grid size-full min-h-64 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-5">
        <div className="flex">
          <motion.div
            animate={torn ? { x: [0, -6, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex h-28 w-52 flex-col justify-between rounded-l-lg bg-(--em-blue-600) p-4 text-(--em-ink-0)"
          >
            <span className="font-mono text-xs opacity-75">ADMIT ONE</span>
            <span className="text-xl font-black">{label}</span>
            <span className="font-mono text-xs opacity-75">ROW 7 · SEAT 12</span>
          </motion.div>
          <motion.div
            animate={
              torn
                ? { rotate: 24, y: 140, x: 20, opacity: 0 }
                : { rotate: 0, y: 0, x: 0, opacity: 1 }
            }
            transition={{ duration: 0.8, ease: "easeIn" }}
            style={{ originX: 0, originY: 0 }}
            className="grid h-28 w-20 place-items-center rounded-r-lg border-l-2 border-dashed border-(--em-blue-300) bg-(--em-blue-700) text-(--em-ink-0)"
          >
            <span className="font-mono text-xs [writing-mode:vertical-rl]">No. 0417</span>
          </motion.div>
        </div>
        <button
          type="button"
          onClick={() => {
            setTorn(!torn);
          }}
          className="rounded-md bg-(--em-ink-800) px-4 py-2 text-sm text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          {torn ? "ตั๋วใบใหม่" : "ฉีกต้นขั้ว"}
        </button>
      </div>
    </div>
  );
}
