"use client";

import { motion } from "motion/react";
import { useState } from "react";

const docs = ["บรีฟ.pdf", "โลโก้.svg", "สัญญา.pdf", "ภาพปก.png", "ราคา.xlsx"];

/** A folder that lifts its papers out, fanned, when you point at it or press it. */
export default function FloatFolder({ papers = 3 }: { papers?: number }) {
  const [open, setOpen] = useState(false);
  const list = docs.slice(0, papers);
  const mid = (list.length - 1) / 2;
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-label="โฟลเดอร์งานลูกค้า"
        onPointerEnter={() => {
          setOpen(true);
        }}
        onPointerLeave={() => {
          setOpen(false);
        }}
        onClick={() => {
          setOpen(!open);
        }}
        className="relative mt-16 h-32 w-44 [perspective:600px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
      >
        <span className="absolute inset-0 rounded-lg bg-(--em-blue-800)" />
        <span className="absolute -top-3 left-0 h-5 w-16 rounded-t-lg bg-(--em-blue-800)" />
        {list.map((d, i) => (
          <motion.span
            key={d}
            className="absolute inset-x-5 top-2 h-24 rounded-md bg-(--em-ink-50) p-2 text-left text-xs text-(--em-ink-700)"
            animate={
              open
                ? { y: -56 - i * 6, x: (i - mid) * 26, rotate: (i - mid) * 7 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: open ? i * 0.04 : 0 }}
          >
            {d}
          </motion.span>
        ))}
        <motion.span
          className="absolute inset-x-0 bottom-0 h-24 rounded-lg bg-(--em-blue-600)"
          style={{ originY: 1 }}
          animate={{ rotateX: open ? -28 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        />
      </button>
    </div>
  );
}
