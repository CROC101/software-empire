"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

export type MenuItem = { label: string; href: string };

const ease = [0.76, 0, 0.24, 1] as const;
/** Grapheme clusters, so Thai vowels and tone marks stay on their letter */
const letters = (s: string) =>
  Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s), (g) => g.segment);

/**
 * The site menu in the style of the registry part `curved-menu`: full screen on a phone, a side
 * sheet from sm up. A modal <dialog> (top layer, focus kept inside, page inert); it closes after
 * the exit animation so the panel can slide out.
 */
export function SiteMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const still = useReducedMotionAfterMount();
  const dlg = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    dlg.current?.showModal();
    const root = document.documentElement;
    // keep the scrollbar's room, or the page under the shade jumps sideways
    if (innerWidth > root.clientWidth) root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
      root.style.scrollbarGutter = "";
    };
  }, [open]);

  const slide = still ? { duration: 0 } : { duration: 0.7, ease };
  const out = still ? { duration: 0 } : { duration: 0.45, ease };
  const hidden = "translateX(calc(100% + 100px))";
  const close = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        aria-label="เปิดเมนู"
        onClick={() => {
          setOpen(true);
        }}
        className="grid size-9 shrink-0 place-items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex h-3.5 w-5 flex-col justify-between">
          <span className="h-0.5 w-full bg-foreground" />
          <span className="h-0.5 w-full bg-foreground" />
          <span className="h-0.5 w-full bg-foreground" />
        </span>
      </button>

      <dialog
        ref={dlg}
        id={id}
        aria-label="เมนู"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent"
      >
        <AnimatePresence onExitComplete={() => dlg.current?.close()}>
          {open && (
            <motion.div
              key="shade"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: slide }}
              exit={{ opacity: 0, transition: out }}
              className="pointer-events-none absolute inset-0 bg-(--em-ink-975)/50"
            />
          )}
          {open && (
            <motion.nav
              key="panel"
              aria-label="เมนูหลัก"
              // a whole `transform` string runs on the compositor (WAAPI); `x` would tick on the main thread
              initial={{ transform: hidden }}
              animate={{ transform: "translateX(0px)", transition: slide }}
              exit={{ transform: hidden, transition: out }}
              className="absolute inset-y-0 right-0 flex w-full flex-col border-l bg-background text-foreground sm:w-[32rem]"
            >
              <button
                type="button"
                aria-label="ปิดเมนู"
                onClick={close}
                className="absolute top-3 right-4 grid size-9 place-items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring sm:right-6"
              >
                <span className="relative block size-5">
                  <span className="absolute top-1/2 left-0 h-0.5 w-full rotate-45 bg-foreground" />
                  <span className="absolute top-1/2 left-0 h-0.5 w-full -rotate-45 bg-foreground" />
                </span>
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-20 pb-10 sm:px-12">
                <p className="border-b pb-2 text-sm text-muted-foreground">เมนู</p>
                <ul>
                  {items.map((it, i) => (
                    <li key={it.href}>
                      <a
                        href={it.href}
                        onClick={close}
                        className="group flex items-baseline gap-3 border-b py-4 outline-none hover:text-(--em-blue-600) focus-visible:text-(--em-blue-600) sm:py-5 dark:hover:text-(--em-sky-400) dark:focus-visible:text-(--em-sky-400)"
                      >
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {/* plain CSS transitions: dozens of motion components per open made the slide stutter */}
                        <span className="inline-block font-heading text-3xl font-black transition-transform duration-500 ease-out motion-safe:group-hover:-translate-x-3 motion-safe:group-focus-visible:-translate-x-3 sm:text-4xl">
                          {letters(it.label).map((g, j) => (
                            <span
                              key={j}
                              style={{ transitionDelay: `${j * 30}ms` }}
                              className="inline-block whitespace-pre transition-transform duration-500 ease-out motion-safe:group-hover:translate-x-3 motion-safe:group-focus-visible:translate-x-3"
                            >
                              {g}
                            </span>
                          ))}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* the curved edge: a bulge that scales flat as the panel lands. The <svg> box scales,
                  not the path inside it, so it stays on the compositor instead of repainting the panel */}
              <motion.svg
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ transformOrigin: "100% 50%" }}
                initial={{ transform: "scaleX(1)" }}
                animate={{
                  transform: "scaleX(0)",
                  transition: still ? { duration: 0 } : { duration: 0.9, ease },
                }}
                exit={{ transform: "scaleX(1)", transition: out }}
                className="absolute inset-y-0 -left-[99px] h-full w-[100px] fill-background"
              >
                <path d="M100 0 Q-100 50 100 100 Z" />
              </motion.svg>
            </motion.nav>
          )}
        </AnimatePresence>
      </dialog>
    </>
  );
}
