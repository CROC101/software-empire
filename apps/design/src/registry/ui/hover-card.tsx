"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

/** Point at (or focus) a name and a profile card floats up after a short wait; it stays while you move onto it. */
export default function HoverCard() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const later = (v: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(v);
    }, ms);
  };
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <p className="max-w-xs text-center text-(--em-ink-200)">
        ออกแบบโดย{" "}
        <span
          className="relative inline-block"
          onPointerEnter={() => {
            later(true, 250);
          }}
          onPointerLeave={() => {
            later(false, 200);
          }}
        >
          <a
            href="#top"
            aria-describedby={open ? id : undefined}
            onFocus={() => {
              later(true, 0);
            }}
            onBlur={() => {
              later(false, 0);
            }}
            className="font-semibold text-(--em-sky-400) underline decoration-dotted underline-offset-4"
          >
            @crocwork
          </a>
          <span className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-3">
            <AnimatePresence>
              {open && (
                <motion.span
                  id={id}
                  role="tooltip"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="block w-64 rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) p-4 text-left shadow-2xl"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-(--em-blue-600) font-heading font-black text-(--em-ink-0)">
                      ค
                    </span>
                    <span>
                      <span className="block font-semibold text-(--em-ink-50)">
                        crocwork studio
                      </span>
                      <span className="block text-xs text-(--em-ink-400)">
                        ทำเว็บ ทำแอป คนเดียว
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 flex gap-4 text-xs text-(--em-ink-300)">
                    <span>
                      <b className="text-(--em-ink-50)">133</b> ชิ้นงาน
                    </span>
                    <span>
                      <b className="text-(--em-ink-50)">12</b> หมวด
                    </span>
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </span>{" "}
        ทั้งชุด
      </p>
    </div>
  );
}
