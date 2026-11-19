"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";

const items = [
  { label: "ผลงาน", href: "#work" },
  { label: "บริการ", href: "#services" },
  { label: "ราคา", href: "#pricing" },
  { label: "ติดต่อ", href: "#contact" },
];
const socials = [
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
];
const ease = [0.76, 0, 0.24, 1] as const;

/** Grapheme clusters, so Thai vowels and tone marks stay on their letter when the word is split */
const letters = (s: string) =>
  Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s), (g) => g.segment);

/**
 * A full-height menu that slides in from the right with a curved leading edge that flattens as it
 * lands. Fills its box (the panel is absolute); for a page-wide menu swap `absolute` for `fixed`.
 * The panel is full width on a phone and a side sheet from 36rem up (container queries).
 */
export default function CurvedMenu() {
  const [open, setOpen] = useState(false);
  const still = useReducedMotionAfterMount();
  const id = useId();

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

  const slide = still ? { duration: 0 } : { duration: 0.8, ease };
  const bar =
    "block h-0.5 w-6 bg-(--em-ink-950) transition-[translate,rotate,opacity] duration-300";

  return (
    <div className="@container relative grid size-full min-h-[30rem] place-items-center overflow-hidden bg-(--em-ink-975)">
      <p className="font-heading text-5xl font-black text-(--em-ink-50) @md:text-7xl">สวัสดี</p>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        onClick={() => {
          setOpen((o) => !o);
        }}
        className="absolute top-4 right-4 z-50 grid size-12 place-items-center rounded-md bg-(--em-ink-50) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-500)"
      >
        <span className="flex h-5 flex-col justify-between">
          <span className={`${bar} ${open ? "translate-y-[9px] rotate-45" : ""}`} />
          <span className={`${bar} ${open ? "opacity-0" : ""}`} />
          <span className={`${bar} ${open ? "-translate-y-[9px] -rotate-45" : ""}`} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id={id}
            aria-label="เมนูหลัก"
            initial={{ x: "calc(100% + 100px)" }}
            animate={{ x: 0, transition: slide }}
            exit={{ x: "calc(100% + 100px)", transition: slide }}
            className="absolute inset-y-0 right-0 z-40 flex w-full flex-col justify-between bg-(--em-ink-50) text-(--em-ink-950) @xl:w-[36rem]"
          >
            <div className="min-h-0 overflow-y-auto px-6 pt-20 @md:px-12 @xl:px-16">
              <p className="border-b border-(--em-ink-950)/20 pb-2 text-sm text-(--em-ink-500)">
                เมนู
              </p>
              <ul>
                {items.map((it, i) => (
                  <li key={it.href}>
                    <motion.a
                      href={it.href}
                      initial="rest"
                      whileHover={still ? undefined : "hover"}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className="flex items-baseline gap-3 border-b border-(--em-ink-950)/20 py-4 outline-none hover:text-(--em-blue-600) focus-visible:text-(--em-blue-600) @md:py-6"
                    >
                      <span className="font-mono text-sm text-(--em-ink-500) tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <motion.span
                        variants={{ rest: { x: 0 }, hover: { x: -16 } }}
                        transition={{ type: "spring", staggerChildren: 0.05, delayChildren: 0.1 }}
                        className="font-heading text-3xl font-black @md:text-5xl"
                      >
                        {letters(it.label).map((g, j) => (
                          <motion.span
                            key={j}
                            variants={{ rest: { x: 0 }, hover: { x: 16 } }}
                            transition={{ type: "spring" }}
                            className="inline-block"
                          >
                            {g}
                          </motion.span>
                        ))}
                      </motion.span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 px-6 py-5 font-mono text-xs @md:px-12 @xl:px-16">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--em-ink-600) underline-offset-4 hover:text-(--em-ink-950) hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* the curved edge: a bulge that scales flat as the panel lands (transform only) */}
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-y-0 -left-[99px] h-full w-[100px] fill-(--em-ink-50)"
            >
              <motion.path
                d="M100 0 Q-100 50 100 100 Z"
                style={{ originX: 1 }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0, transition: still ? { duration: 0 } : { duration: 1, ease } }}
                exit={{ scaleX: 1, transition: slide }}
              />
            </svg>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
