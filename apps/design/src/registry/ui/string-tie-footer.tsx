"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

// in a 640 × 400 box: the button on the body; the cord winds round it and the flap button
const LOW = { x: 320, y: 292 };
const EIGHT =
  "M332 300 C366 278 296 232 308 206 C314 184 340 186 334 206 C326 232 282 270 302 292 C316 310 344 312 334 298 C360 276 300 230 310 208 C318 190 336 192 330 210 C320 236 288 272 306 290";
const SIGN =
  "M70 340 C82 316 96 312 100 330 C104 350 116 320 128 326 C140 332 132 352 150 338 C164 326 170 330 182 334 L220 328";

function Grommet() {
  return (
    <span className="grid size-full place-items-center rounded-full bg-(--em-blue-500) shadow-md ring-2 ring-(--em-blue-700)">
      <span className="size-1/3 rounded-full bg-(--em-blue-800) ring-2 ring-(--em-ink-0)/70" />
    </span>
  );
}

/**
 * A string-and-button envelope as a footer: a white flap over a dark body, held by two paper
 * buttons. In view, the cord winds a figure eight shut, then the signature writes itself in.
 * Pressing either button unwinds the cord, folds the flap back and slides out a note with a way
 * to write back.
 */
export default function StringTieFooter({ email = "hello@example.com" }: { email?: string }) {
  const still = useReducedMotionAfterMount();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const on = seen || still;
  const [open, setOpen] = useState(false);
  const d = (s: number, delay = 0) =>
    still ? { duration: 0 } : { duration: s, delay, ease: "easeInOut" as const };
  const toggle = () => {
    setOpen((o) => !o);
  };
  const pct = (p: { x: number; y: number }) => ({
    left: `${String((p.x / 640) * 100)}%`,
    top: `${String((p.y / 400) * 100)}%`,
  });

  return (
    <footer
      ref={ref}
      className="@container relative isolate grid size-full min-h-[38rem] place-items-center overflow-clip bg-(--em-ink-100) px-6 pt-40 pb-12 text-(--em-ink-975)"
    >
      <div className="relative aspect-[8/5] w-full max-w-2xl [perspective:1600px]">
        {/* the note, behind the body until opened */}
        <motion.div
          animate={{ y: open ? "-58%" : "0%" }}
          transition={open ? d(0.7, 0.9) : d(0.5)}
          className="absolute inset-x-[7%] top-[6%] z-10 h-[86%] rounded-sm bg-(--em-ink-0) p-[5%] shadow-lg"
        >
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            A note
          </p>
          <p className="mt-2 font-heading text-[clamp(1.25rem,4cqi,2rem)] leading-tight font-black">
            ขอบคุณที่อ่านมาจนถึงตรงนี้
          </p>
          <p className="mt-2 text-sm text-(--em-ink-600)">
            มีงานอยากคุยด้วย เขียนมาได้เลย ตอบเองทุกฉบับ
          </p>
          <a
            href={`mailto:${email}`}
            tabIndex={open ? 0 : -1}
            className="mt-4 inline-block rounded-md bg-(--em-blue-600) px-4 py-2 font-bold text-(--em-ink-0) hover:bg-(--em-blue-700)"
          >
            {email}
          </a>
        </motion.div>

        {/* the body */}
        <div className="absolute inset-0 z-20 overflow-clip rounded-xl bg-(--em-ink-850) shadow-2xl">
          <span className="absolute bottom-[6%] left-[60%] font-mono text-xs tracking-[0.2em] text-(--em-ink-400) uppercase">
            Par avion
          </span>
        </div>

        {/* the flap, with the top button on its tip */}
        <motion.div
          animate={{ rotateX: open ? 180 : 0 }}
          transition={open ? d(0.6, 0.45) : d(0.6, 0.5)}
          style={{ zIndex: open ? 5 : 30 }}
          className="absolute inset-x-0 top-0 h-[52%] origin-top [transform-style:preserve-3d]"
        >
          <svg viewBox="0 0 640 208" preserveAspectRatio="none" className="size-full" aria-hidden>
            <path
              d="M0 12 Q0 0 12 0 L628 0 Q640 0 640 12 L340 200 Q320 212 300 200 Z"
              className="fill-(--em-ink-25) stroke-(--em-ink-200)"
            />
          </svg>
          <button
            type="button"
            aria-label={open ? "ปิดซอง" : "เปิดซอง"}
            aria-expanded={open}
            onClick={toggle}
            style={{ left: "50%", top: "94%" }}
            className="absolute size-[7%] min-h-6 min-w-6 -translate-1/2 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-500)"
          >
            <Grommet />
          </button>
        </motion.div>

        {/* the cord, then the signature */}
        <svg
          viewBox="0 0 640 400"
          className="pointer-events-none absolute inset-0 z-40 size-full overflow-visible"
          aria-hidden
        >
          <motion.path
            d={EIGHT}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: on && !open ? 1 : 0 }}
            transition={open ? d(0.45) : d(1.4, 0.2)}
            className="fill-none stroke-(--em-gold-300)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <motion.path
            d="M334 298 C352 330 336 352 356 380 C368 396 386 392 392 404"
            animate={still ? {} : { rotate: [-3, 3] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            style={{ transformOrigin: "334px 298px" }}
            className="vt-live fill-none stroke-(--em-gold-300)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <motion.path
            d={SIGN}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: on ? 1 : 0 }}
            transition={d(1.1, 1.7)}
            className="fill-none stroke-(--em-ink-50)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <button
          type="button"
          aria-label={open ? "ปิดซอง" : "เปิดซอง"}
          aria-expanded={open}
          onClick={toggle}
          style={pct(LOW)}
          className="absolute z-30 size-[7%] min-h-6 min-w-6 -translate-1/2 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-500)"
        >
          <Grommet />
        </button>
        <span className="sr-only" aria-live="polite">
          {open ? "เปิดซองแล้ว" : ""}
        </span>
      </div>
      <p className="mt-6 text-sm text-(--em-ink-500)">กดกระดุมเพื่อเปิดซอง</p>
    </footer>
  );
}
