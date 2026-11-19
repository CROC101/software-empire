"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";

const from = {
  right: { panel: "inset-y-0 right-0 w-72 max-w-[85%]", hidden: { x: "100%" } },
  left: { panel: "inset-y-0 left-0 w-72 max-w-[85%]", hidden: { x: "-100%" } },
  bottom: { panel: "inset-x-0 bottom-0 h-2/3 rounded-t-xl", hidden: { y: "100%" } },
};

/** A sheet that slides in from the chosen edge over a dimmed stage. Esc or the backdrop closes it. */
export default function DrawerSheet({ side = "right" }: { side?: "right" | "left" | "bottom" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const s = from[side];

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div className="relative grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(true);
        }}
        className="rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-5 py-2.5 font-semibold text-(--em-ink-50)"
      >
        เปิดแผง
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="bg"
              aria-hidden
              className="absolute inset-0 bg-(--em-ink-975)/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setOpen(false);
              }}
            />
            <motion.aside
              key="panel"
              id={id}
              role="dialog"
              aria-modal="true"
              aria-label="ตัวกรอง"
              initial={s.hidden}
              animate={{ x: 0, y: 0 }}
              exit={s.hidden}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={`absolute border-(--em-ink-700) bg-(--em-ink-900) p-5 shadow-2xl ${s.panel}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg font-black text-(--em-ink-50)">ตัวกรอง</h3>
                <button
                  type="button"
                  aria-label="ปิด"
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="grid size-8 place-items-center rounded-md text-(--em-ink-400) hover:bg-(--em-ink-800)"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-(--em-ink-200)">
                {["ทั้งหมด", "ปุ่ม", "การ์ด", "พื้นหลัง"].map((x) => (
                  <li key={x} className="rounded-md bg-(--em-ink-800) px-3 py-2">
                    {x}
                  </li>
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
