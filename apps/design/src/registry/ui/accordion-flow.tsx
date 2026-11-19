"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId, useState } from "react";

const faqs = [
  { q: "ใช้ชิ้นส่วนพวกนี้ได้ฟรีไหม", a: "ได้ คัดลอกโค้ดไปใช้ในงานของคุณได้เลย ไม่ต้องขอ" },
  {
    q: "ต้องติดตั้งอะไรเพิ่ม",
    a: "ส่วนใหญ่ใช้แค่ React, Tailwind และ motion บางชิ้นไม่ต้องใช้อะไรเลย",
  },
  {
    q: "รองรับมือถือหรือเปล่า",
    a: "ทุกชิ้นทดสอบที่จอกว้าง 390 พิกเซล และเคารพการตั้งค่าลดการเคลื่อนไหว",
  },
];

/**
 * One answer open at a time. Rows below glide with layout (transform-based FLIP) and the answer fades up,
 * so nothing animates height directly.
 */
export default function AccordionFlow() {
  const [open, setOpen] = useState<number | null>(0);
  const id = useId();
  return (
    <div className="grid size-full min-h-96 place-items-start justify-center bg-(--em-ink-975) p-6">
      <LayoutGroup>
        <ul className="w-full max-w-md space-y-2">
          {faqs.map((f, i) => {
            const on = open === i;
            return (
              <motion.li
                layout
                key={f.q}
                className="overflow-hidden rounded-lg border border-(--em-ink-800) bg-(--em-ink-900)"
              >
                <motion.h3 layout="position">
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`${id}-${String(i)}`}
                    onClick={() => {
                      setOpen(on ? null : i);
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left font-semibold text-(--em-ink-50)"
                  >
                    {f.q}
                    <motion.span
                      animate={{ rotate: on ? 45 : 0 }}
                      className="shrink-0 text-(--em-sky-400)"
                    >
                      <Plus aria-hidden className="size-4" />
                    </motion.span>
                  </button>
                </motion.h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.p
                      id={`${id}-${String(i)}`}
                      layout="position"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 text-sm text-(--em-ink-300)"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </div>
  );
}
