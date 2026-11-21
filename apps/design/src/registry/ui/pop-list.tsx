"use client";

import { motion } from "motion/react";
import { useState } from "react";

const orders = [
  "ออเดอร์ #1042 · ลาเต้เย็น",
  "ออเดอร์ #1043 · ชาไทย",
  "ออเดอร์ #1044 · อเมริกาโน่",
  "ออเดอร์ #1045 · โกโก้",
  "ออเดอร์ #1046 · มัทฉะลาเต้",
  "ออเดอร์ #1047 · น้ำผึ้งมะนาว",
  "ออเดอร์ #1048 · เอสเพรสโซ่",
  "ออเดอร์ #1049 · ชาเขียวนม",
];

/** A scrolling list whose rows pop in as they come into view; arrow keys move a highlight. */
export default function PopList({ items = 8 }: { items?: number }) {
  const rows = orders.slice(0, Math.max(3, Math.min(orders.length, items)));
  const [at, setAt] = useState(0);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        role="listbox"
        tabIndex={0}
        aria-label="ออเดอร์วันนี้"
        aria-activedescendant={`pop-${String(at)}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAt(Math.min(rows.length - 1, at + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAt(Math.max(0, at - 1));
          }
        }}
        className="flex h-60 w-full max-w-xs flex-col gap-2 overflow-y-auto rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        {rows.map((r, k) => (
          <motion.div
            key={r}
            id={`pop-${String(k)}`}
            role="option"
            aria-selected={at === k}
            onClick={() => {
              setAt(k);
            }}
            initial={{ scale: 0.7, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ amount: 0.5 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className={`shrink-0 cursor-pointer rounded-md px-4 py-3 text-sm ${at === k ? "bg-(--em-blue-700) text-(--em-ink-0)" : "bg-(--em-ink-850) text-(--em-ink-200)"}`}
          >
            {r}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
