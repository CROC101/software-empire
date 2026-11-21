"use client";

import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const spin = [14, -26, 32, -10, 0, 20, -30, 24, -16];

/** A note folds in on itself into a ball, tile by tile, then drops into the bin. */
export default function CrumpleNote({ speed = 1 }: { speed?: number }) {
  const [gone, setGone] = useState(false);
  const d = 0.5 / speed;
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-end gap-10">
          <motion.div
            animate={
              gone
                ? { x: 128, y: 40, scale: 0.3, opacity: 0 }
                : { x: 0, y: 0, scale: 1, opacity: 1 }
            }
            transition={{ delay: gone ? d : 0, duration: d, ease: "easeIn" }}
            className="relative size-36"
          >
            <div aria-hidden className="grid size-full grid-cols-3 grid-rows-3">
              {spin.map((r, i) => {
                const dx = (1 - (i % 3)) * 48;
                const dy = (1 - Math.floor(i / 3)) * 48;
                return (
                  <motion.span
                    key={r}
                    className="block border border-(--em-ink-200)/60 bg-(--em-ink-50)"
                    animate={
                      gone
                        ? { x: dx * 0.7, y: dy * 0.7, rotate: r, scale: 0.6 }
                        : { x: 0, y: 0, rotate: 0, scale: 1 }
                    }
                    transition={{ duration: d, ease: "easeOut" }}
                  />
                );
              })}
            </div>
            <motion.p
              animate={{ opacity: gone ? 0 : 1 }}
              transition={{ duration: d / 2 }}
              className="absolute inset-0 p-3 text-sm text-(--em-ink-800)"
            >
              โทรหาลูกค้าก่อนบ่ายสาม ส่งไฟล์โลโก้ชุดสุดท้าย
            </motion.p>
          </motion.div>
          <Trash2 aria-hidden className="size-10 text-(--em-ink-500)" strokeWidth={1.5} />
        </div>
        <button
          type="button"
          onClick={() => {
            setGone(!gone);
          }}
          className="rounded-md bg-(--em-ink-800) px-4 py-2 text-sm text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          {gone ? "เขียนใหม่" : "ทิ้งโน้ต"}
        </button>
      </div>
    </div>
  );
}
