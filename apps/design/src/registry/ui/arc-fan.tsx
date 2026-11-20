"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const cards = [
  ["aurora-tide", "Aurora"],
  ["deep-galaxy", "Galaxy"],
  ["dither-tide", "Dither"],
  ["float-particles", "Float"],
  ["particle-title", "Title"],
  ["ripple-mesh", "Mesh"],
  ["ripple-pond", "Pond"],
  ["tide-plasma", "Plasma"],
  ["warp-lanes", "Warp"],
  ["where-globe", "Globe"],
] as const;
const n = cards.length;

/**
 * A fanned wheel of ten cards hinged on a pivot far below the stage. A step does not move the
 * fan as one: the card that leads moves first and the tension runs outward card by card, like a
 * plucked string, each on its own spring. Cards rise and fan out on first view.
 */
export default function ArcFan({ gap = 16 }: { gap?: number }) {
  const still = useReducedMotionAfterMount();
  const [i, setI] = useState(4);
  const go = (to: number) => {
    setI(Math.max(0, Math.min(n - 1, to)));
  };
  const label = cards[i]?.[1] ?? "";

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="พัดการ์ด"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        else if (e.key === "ArrowLeft") go(i - 1);
        else if (e.key === "Home") go(0);
        else if (e.key === "End") go(n - 1);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col overflow-clip bg-(--em-ink-50) py-8 text-(--em-ink-950) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-blue-500)"
    >
      <p className="px-6 text-center font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
        Spring arc
      </p>
      <p
        aria-live="polite"
        className="mt-2 px-6 text-center font-heading text-4xl font-black @2xl:text-6xl"
      >
        {label}
      </p>

      <motion.div
        className="relative mt-4 min-h-80 flex-1 touch-pan-y"
        onPanEnd={(_, { offset }) => {
          if (Math.abs(offset.x) > 40) go(i + (offset.x < 0 ? 1 : -1));
        }}
      >
        {cards.map(([slug, name], k) => {
          const d = k - i;
          return (
            <motion.button
              key={slug}
              type="button"
              tabIndex={-1}
              aria-label={name}
              onClick={() => {
                go(k);
              }}
              initial={still ? false : { rotate: 0, y: 220, opacity: 0 }}
              animate={{
                rotate: d * gap,
                y: d === 0 ? -12 : 0,
                scale: d === 0 ? 1.06 : 1,
                opacity: Math.abs(d) > 5 ? 0 : 1 - Math.abs(d) * 0.08,
              }}
              transition={
                still
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 140,
                      damping: 14,
                      // the chain: tension reaches far cards later
                      delay: Math.abs(d) * 0.035,
                    }
              }
              style={{ zIndex: 20 - Math.abs(d) }}
              className={cn(
                "absolute bottom-6 left-1/2 -ms-[clamp(4.5rem,13cqi,6.5rem)] aspect-[3/4] w-[clamp(9rem,26cqi,13rem)] origin-[50%_280%] overflow-clip rounded-xl border-4 border-(--em-ink-0) bg-(--em-ink-200) shadow-xl",
                d === 0 && "shadow-2xl",
              )}
            >
              <img
                src={`/orbit/${slug}.webp`}
                alt=""
                draggable={false}
                className="size-full object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-(--em-ink-975)/60 px-2 py-1 text-start font-mono text-[0.625rem] tracking-[0.15em] text-(--em-ink-50) uppercase">
                {name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="flex items-center justify-center gap-2 px-6">
        {(
          [
            [-1, "ก่อนหน้า", ArrowLeft],
            [1, "ถัดไป", ArrowRight],
          ] as const
        ).map(([by, text, Icon]) => (
          <button
            key={by}
            type="button"
            aria-label={text}
            disabled={(by < 0 && i === 0) || (by > 0 && i === n - 1)}
            onClick={() => {
              go(i + by);
            }}
            className="grid size-11 place-items-center rounded-md border border-(--em-ink-200) hover:bg-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-blue-500) disabled:opacity-40"
          >
            <Icon className="size-5" aria-hidden />
          </button>
        ))}
        <span className="ms-2 font-mono text-xs text-(--em-ink-500) tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}
