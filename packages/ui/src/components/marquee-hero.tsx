"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

export type MarqueeHeroShot = { src: string; alt: string };

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
} as const;

/**
 * A light hero with no WebGL: chip, a headline whose words rise one after another, a lead line,
 * the actions, and a band of real screenshots sliding along the bottom, each card tilted a little.
 * The band is one CSS transform loop (the list twice, moved by half), so it costs no script per
 * frame. Pass screenshots at least twice the card's shown size so they stay sharp on retina.
 * After the 21st.dev hero-3 (AnimatedMarqueeHero). Reduced motion: text in place, band still.
 */
export function MarqueeHero({
  eyebrow,
  lines,
  title,
  background,
  lead,
  shots,
  children,
  seconds = 60,
  className,
}: {
  eyebrow?: ReactNode;
  /** Headline lines; the second reads in crocwork blue. Words rise one by one. */
  lines: string[];
  /** Replaces the rising words with your own headline content; `lines` stay its accessible text. */
  title?: ReactNode;
  /** Decoration behind everything, e.g. <GridPulse />. */
  background?: ReactNode;
  lead?: ReactNode;
  shots: MarqueeHeroShot[];
  /** Actions under the lead (buttons, links). */
  children?: ReactNode;
  /** One full lap of the band. */
  seconds?: number;
  className?: string;
}) {
  const still = useReducedMotionAfterMount();
  const show = still ? false : "hidden";
  let w = 0;

  return (
    <section
      className={cn(
        "relative isolate flex min-h-svh w-full flex-col items-center overflow-clip bg-background px-4 text-center",
        className,
      )}
    >
      {background}
      <div className="z-10 flex flex-1 flex-col items-center justify-center pt-16 pb-[min(44svh,24rem)]">
        {eyebrow && (
          <motion.div
            initial={show}
            animate="show"
            variants={rise}
            className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
          >
            {eyebrow}
          </motion.div>
        )}
        {title ? (
          <h1
            aria-label={lines.join(" ")}
            className="w-full max-w-5xl font-heading text-5xl leading-[1.1] font-black text-foreground md:text-7xl"
          >
            {title}
          </h1>
        ) : (
          <motion.h1
            initial={show}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="pk-depth max-w-5xl font-heading text-5xl leading-[1.1] font-black text-balance text-foreground md:text-7xl"
          >
            {lines.map((line, l) => (
              <span key={l} className={cn("block", l === 1 && "cw-blue")}>
                {line.split(" ").map((word) => (
                  <motion.span key={w++} variants={rise} className="inline-block">
                    {word}&nbsp;
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>
        )}
        {lead && (
          <motion.div
            initial={show}
            animate="show"
            variants={rise}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            {lead}
          </motion.div>
        )}
        {children && (
          <motion.div
            initial={show}
            animate="show"
            variants={rise}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {children}
          </motion.div>
        )}
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[min(40svh,22rem)] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_85%,transparent)]"
      >
        <div
          className="vt-live flex h-full w-max items-center motion-safe:animate-[em-marquee_var(--mq-s)_linear_infinite]"
          style={{ "--mq-s": `${String(seconds)}s` } as CSSProperties}
        >
          {[...shots, ...shots].map((s, i) => (
            <div
              key={i}
              className="mr-6 aspect-[16/10] h-40 shrink-0 md:h-56"
              style={{ transform: `rotate(${i % 2 ? 3 : -2}deg)` }}
            >
              <img
                src={s.src}
                alt=""
                width={1440}
                height={900}
                decoding="async"
                draggable={false}
                className="size-full rounded-xl border object-cover object-top shadow-lg [image-rendering:high-quality]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
