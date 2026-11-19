"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * A dialog that rises out of the water while the stage darkens. Esc, the cross or the backdrop close it,
 * and focus returns to the opener.
 * shortcut: scoped to the preview stage (absolute, not a top-layer <dialog>) so it stays inside gallery cards;
 * use <dialog>.showModal() for a real page.
 */
export default function ModalRise() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    const btn = opener.current;
    return () => {
      window.removeEventListener("keydown", key);
      btn?.focus();
    };
  }, [open]);

  return (
    <div className="relative grid size-full min-h-80 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <button
        ref={opener}
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
        }}
        className="rounded-lg bg-(--em-blue-600) px-5 py-2.5 font-semibold text-(--em-ink-0)"
      >
        เปิดหน้าต่าง
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="m"
            className="absolute inset-0 grid place-items-center bg-(--em-ink-975)/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-t`}
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-sm rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 id={`${id}-t`} className="font-heading text-xl font-black text-(--em-ink-50)">
                  ยืนยันการส่งงาน
                </h3>
                <button
                  ref={close}
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
              <p className="mt-2 text-sm text-(--em-ink-300)">
                ส่งแล้วลูกค้าจะได้รับแจ้งทันที ยังแก้ไขได้ภายใน 24 ชั่วโมง
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-(--em-ink-200) hover:bg-(--em-ink-800)"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="rounded-lg bg-(--em-blue-600) px-4 py-2 text-sm font-semibold text-(--em-ink-0)"
                >
                  ส่งงาน
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
