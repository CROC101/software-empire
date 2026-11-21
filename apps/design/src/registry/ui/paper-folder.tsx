"use client";

import { motion } from "motion/react";
import { useState } from "react";

const papers = ["ใบเสนอราคา", "สัญญา", "ใบแจ้งหนี้"];

/** A folder that opens its flap on click and fans three sheets up out of it. */
export default function PaperFolder() {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "ปิดแฟ้ม" : "เปิดแฟ้ม"}
        onClick={() => {
          setOpen(!open);
        }}
        className="relative h-32 w-44 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--em-sky-400)"
        style={{ perspective: 600 }}
      >
        <span
          aria-hidden
          className="absolute -top-3 left-0 h-6 w-16 rounded-t-md bg-(--em-blue-800)"
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-lg rounded-tl-none bg-(--em-blue-800)"
        />
        {papers.map((t, k) => (
          <motion.span
            key={t}
            aria-hidden
            animate={
              open
                ? { y: -70 + k * 8, x: (k - 1) * 46, rotate: (k - 1) * 10 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: open ? k * 0.05 : 0 }}
            className="absolute inset-x-5 top-2 bottom-4 grid place-items-start rounded-md bg-(--em-ink-0) p-2 text-left text-xs font-semibold text-(--em-ink-800)"
          >
            {t}
          </motion.span>
        ))}
        <motion.span
          aria-hidden
          animate={{ rotateX: open ? -35 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="absolute inset-x-0 bottom-0 h-[85%] origin-bottom rounded-lg bg-(--em-blue-600)"
        />
      </button>
    </div>
  );
}
