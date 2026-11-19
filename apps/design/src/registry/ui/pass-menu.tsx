"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const items = [
  { label: "ผลงาน", href: "#work" },
  { label: "บริการ", href: "#services" },
  { label: "ราคา", href: "#pricing" },
  { label: "ติดต่อ", href: "#contact" },
];
// bar widths for the stub's barcode, in px
const bars = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 4, 1, 2, 1, 3];

/**
 * A menu that drops in as an admission ticket: the links on the main part, a perforated tear line,
 * and a stub with a barcode. Esc or the button closes it; focus moves to the first link on open.
 */
export default function PassMenu({ event = "crocwork 2026" }: { event?: string }) {
  const still = useReducedMotionAfterMount();
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLAnchorElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div className="@container relative grid size-full min-h-[32rem] place-items-start justify-center overflow-clip bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="relative z-20 rounded-md bg-(--em-ink-50) px-5 py-2.5 font-semibold text-(--em-ink-950) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-500)"
      >
        {open ? "ปิดเมนู" : "เมนู"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id={id}
            aria-label="เมนูหลัก"
            initial={{ y: "-120%", rotate: -4, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: "-120%", rotate: 3, opacity: 0 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 22 }}
            style={{ originY: 0 }}
            className="absolute top-20 left-1/2 z-10 -ml-[min(10rem,45%)] w-[min(20rem,90%)] text-(--em-ink-950)"
          >
            <div className="rounded-t-xl bg-(--em-ink-50) px-6 pt-5 pb-4">
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-(--em-ink-500)">
                ADMIT ONE
              </p>
              <p className="mt-1 text-sm text-(--em-ink-600)">{event}</p>
              <ul className="mt-4">
                {items.map((it, i) => (
                  <li key={it.href}>
                    <a
                      ref={i === 0 ? first : undefined}
                      href={it.href}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className="flex items-baseline gap-3 border-b border-dashed border-(--em-ink-300) py-3 outline-none hover:text-(--em-blue-600) focus-visible:text-(--em-blue-600)"
                    >
                      <span className="font-mono text-xs text-(--em-ink-500) tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-heading text-2xl font-black">{it.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* the tear line: two notches in the stage colour and a row of punched holes */}
            <div aria-hidden className="relative flex h-5 items-center bg-(--em-ink-50)">
              <span className="absolute -left-2.5 size-5 rounded-full bg-(--em-ink-975)" />
              <span className="absolute -right-2.5 size-5 rounded-full bg-(--em-ink-975)" />
              <span className="mx-4 flex flex-1 justify-between">
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className="size-1.5 rounded-full bg-(--em-ink-975)" />
                ))}
              </span>
            </div>

            <div className="flex items-end justify-between rounded-b-xl bg-(--em-ink-50) px-6 pt-2 pb-5">
              <div>
                <p className="text-xs text-(--em-ink-500)">ที่นั่ง</p>
                <p className="font-mono text-sm tabular-nums">A-07</p>
              </div>
              <span aria-hidden className="flex h-10 items-stretch gap-[2px]">
                {bars.map((w, i) => (
                  <span key={i} className="bg-(--em-ink-950)" style={{ width: w }} />
                ))}
              </span>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
