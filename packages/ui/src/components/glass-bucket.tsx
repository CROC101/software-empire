"use client";

import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A glass tray that chips drop into, one after another, on a loop: what goes into every job.
 *
 * After 21st.dev "bucket": the same tray outline and drop. Its six SVG backdrop blurs (one 60px
 * over the whole tray, repainted every frame a chip moves) are gone: the front is a solid card,
 * the rim a token tint. Colours from tokens, lucide icons in place of hugeicons, the loop pauses
 * off screen, and with reduced motion the first chip just sits there.
 */

export interface BucketChip {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const EASE = [0.455, 0.03, 0.515, 0.955] as const;

// rim and side flaps (viewBox 0 0 655 352), from the original tray
const FLAP_R =
  "M535.59 78.7427L487.973 42.8776L558.738 13.9516C562.902 12.2494 564.984 11.3984 567.143 11.5597C569.301 11.7211 571.233 12.8723 575.098 15.1747L590.22 24.1832C603.923 32.347 610.775 36.4289 610.372 42.0779C609.97 47.7269 602.609 50.7964 587.887 56.9354L535.59 78.7427Z";
const FLAP_L =
  "M123.116 79.1145L171.548 42.8776L97.2715 12.5164C94.8305 11.5186 93.61 11.0197 92.3446 11.1143C91.0793 11.2089 89.9465 11.8837 87.681 13.2334L56.155 32.0149C48.1832 36.7641 44.1973 39.1386 44.4205 42.4378C44.6438 45.737 48.9132 47.553 57.4522 51.1849L123.116 79.1145Z";
const RIM = "M487.973 42.8774L171.548 42.8775L123.116 79.1144L535.59 78.7424L487.973 42.8774Z";
const CORNER_L = "M171.548 78.9088V42.8774L123.116 79.1144L171.548 78.9088Z";
const CORNER_R = "M487.973 78.9088V42.8774L536.404 79.1144L487.973 78.9088Z";
const BODY =
  "M512.766 79.1595L147.766 79.1624C136.453 79.1625 130.796 79.1626 127.281 82.6773C123.766 86.192 123.766 91.8488 123.766 103.162V327.159C123.766 338.473 123.766 344.13 127.281 347.645C130.796 351.159 136.453 351.159 147.766 351.159H512.766C524.08 351.159 529.737 351.159 533.252 347.645C536.766 344.13 536.766 338.473 536.766 327.159V103.159C536.766 91.8457 536.766 86.1888 533.252 82.6741C529.737 79.1594 524.08 79.1594 512.766 79.1595Z";
const LIP =
  "M74.6011 164.033L123.116 79.1138L535.59 78.7419L581.532 164.469C588.006 176.55 591.243 182.59 588.568 187.06C585.892 191.529 579.039 191.529 565.333 191.529H90.5591C76.4759 191.529 69.4343 191.529 66.7781 186.953C64.1219 182.376 67.615 176.262 74.6011 164.033Z";

const glass = (pct: number) =>
  `color-mix(in oklab, var(--card) ${String(pct)}%, color-mix(in oklab, var(--em-blue-500) 12%, transparent))`;
const edge = "color-mix(in oklab, var(--foreground) 16%, transparent)";
// the body: the card colour with a little blue, so it stands off the page in either theme
const body = "color-mix(in oklab, var(--card) 92%, var(--em-blue-500))";
const rim = "color-mix(in oklab, var(--em-sky-500) 45%, transparent)";

export function GlassBucket({
  chips,
  every = 2400,
  className,
}: {
  chips: readonly BucketChip[];
  /** ms between chips */
  every?: number;
  className?: string;
}) {
  const root = React.useRef<HTMLDivElement>(null);
  const [turn, setTurn] = React.useState(0);
  const [small, setSmall] = React.useState(false);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const narrow = window.matchMedia("(max-width: 640px)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let onScreen = false;
    const sync = () => {
      setSmall(narrow.matches);
      window.clearInterval(timer);
      timer = 0;
      if (onScreen && !still.matches && !document.hidden) {
        timer = window.setInterval(() => {
          setTurn((n) => n + 1);
        }, every);
      }
    };
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(el);
    narrow.addEventListener("change", sync);
    still.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      narrow.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [every]);

  const index = chips.length ? turn % chips.length : 0;
  const chip = chips[index];

  return (
    <div
      ref={root}
      className={cn("relative isolate w-full max-w-[655px]", className)}
      style={{ aspectRatio: "655/352" }}
    >
      {/* back: flaps, rim, corners */}
      <svg viewBox="0 0 655 352" fill="none" aria-hidden className="absolute inset-0 size-full">
        <path d={FLAP_R} fill={glass(55)} stroke={edge} />
        <path d={FLAP_L} fill={glass(55)} stroke={edge} />
        <path d={RIM} fill={glass(35)} stroke={edge} />
        <path d={CORNER_L} fill={glass(45)} />
        <path d={CORNER_R} fill={glass(45)} />
      </svg>

      {/* the chip falling in */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center pb-[65%]">
        <AnimatePresence mode="popLayout" initial={false}>
          {chip && (
            <motion.div
              key={index}
              initial={{ y: small ? -70 : -100, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: small ? 1 : 1.25 }}
              exit={{ y: small ? 100 : 130, scale: 0.8, transition: { duration: 0.8, ease: EASE } }}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute flex w-[240px] origin-bottom items-center gap-2 rounded-full border bg-card p-2 shadow-sm"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--em-blue-500)_12%,transparent)] text-[var(--em-blue-600)] dark:text-[var(--em-sky-500)] [&_svg]:size-5">
                {chip.icon}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-bold leading-tight">{chip.title}</span>
                <span className="truncate text-xs text-muted-foreground">{chip.description}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* front: the body and the lip the chips drop behind */}
      <svg
        viewBox="0 0 655 352"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 size-full drop-shadow-[0_18px_30px_color-mix(in_oklab,var(--em-blue-700)_14%,transparent)]"
      >
        <path d={BODY} fill={body} stroke={edge} />
        <path d={LIP} fill={glass(88)} stroke={edge} />
        {/* light catching the lip's top edge */}
        <path
          d="M123.116 79.1138L535.59 78.7419"
          stroke={rim}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* the whole list for screen readers; the loop above is decoration */}
      <ul className="sr-only">
        {chips.map((c) => (
          <li key={c.title}>
            {c.title}: {c.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
