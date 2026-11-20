"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useEffect, useState } from "react";

const cards = [
  { slug: "warp-lanes", title: "Warp Lanes", tone: "--em-sky-400" },
  { slug: "deep-galaxy", title: "Deep Galaxy", tone: "--em-blue-500" },
  { slug: "aurora-tide", title: "Aurora Tide", tone: "--em-blue-200" },
  { slug: "tide-plasma", title: "Tide Plasma", tone: "--em-blue-400" },
  { slug: "where-globe", title: "Where Globe", tone: "--em-blue-300" },
  { slug: "ripple-pond", title: "Ripple Pond", tone: "--em-sky-500" },
];
const n = cards.length;
// slow creep at both ends, fast through the middle
const spin = [0.83, 0, 0.17, 1] as const;

/**
 * A ring of cards on a cylinder that turns on its own. Each turn creeps, rushes and creeps again;
 * the ring stretches a touch as it rushes, the front card casts a soft glow above and below in its
 * colour, and a ghost numeral swaps behind. Pauses while pointed at or focused.
 */
export default function WarpRing({ seconds = 4 }: { seconds?: number }) {
  const still = useReducedMotionAfterMount();
  const [pos, setPos] = useState(0);
  const [held, setHeld] = useState(false);
  const [scope, run] = useAnimate();
  const i = ((pos % n) + n) % n;

  // the ring stretches a touch while it rushes through each turn
  useEffect(() => {
    if (still || pos === 0) return;
    void run(scope.current, { scaleX: [1, 1.1, 1] }, { duration: 1.4, ease: "easeInOut" });
  }, [pos, still, run, scope]);
  const c = cards[i] ?? cards[0];

  useEffect(() => {
    if (still || held) return;
    const t = setInterval(() => {
      setPos((p) => p + 1);
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [still, held, seconds]);

  if (!c) return null;
  const t = still ? { duration: 0 } : { duration: 1.4, ease: spin };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="วงแหวนผลงาน"
      tabIndex={0}
      onPointerEnter={() => {
        setHeld(true);
      }}
      onPointerLeave={() => {
        setHeld(false);
      }}
      onFocus={() => {
        setHeld(true);
      }}
      onBlur={() => {
        setHeld(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setPos(pos + 1);
        else if (e.key === "ArrowLeft") setPos(pos - 1);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col items-center overflow-clip bg-(--em-ink-975) py-8 text-(--em-ink-50) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-sky-400)"
    >
      <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">Warp ring</p>

      <div className="relative grid w-full flex-1 place-items-center [--w:clamp(8.5rem,24cqi,13rem)] [perspective:1000px]">
        {/* ghost numeral */}
        <AnimatePresence initial={false}>
          <motion.span
            key={i}
            aria-hidden
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.08, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={t}
            className="absolute font-heading text-[clamp(10rem,40cqi,22rem)] leading-none font-black"
          >
            {String(i + 1).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>

        {/* glow above and below, in the front card's colour */}
        {[-1, 1].map((side) => (
          <AnimatePresence key={side} initial={false}>
            <motion.span
              key={c.tone}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={t}
              style={{
                background: `var(${c.tone})`,
                top: side < 0 ? "6%" : undefined,
                bottom: side > 0 ? "6%" : undefined,
              }}
              className="absolute h-10 w-[min(70%,32rem)] rounded-[50%] blur-2xl"
            />
          </AnimatePresence>
        ))}

        <div ref={scope} className="[transform-style:preserve-3d]">
          <div className="[transform-style:preserve-3d] [transform:translateZ(calc(var(--w)*-0.95))]">
            <motion.div
              animate={{ rotateY: (-pos * 360) / n }}
              transition={t}
              className="relative aspect-[3/4] w-(--w) [transform-style:preserve-3d]"
            >
              {cards.map((x, k) => (
                <div
                  key={x.slug}
                  style={{
                    transform: `rotateY(${(k * 360) / n}deg) translateZ(calc(var(--w) * 0.95))`,
                  }}
                  className="absolute inset-0 overflow-clip rounded-xl border border-(--em-ink-700) [backface-visibility:hidden]"
                >
                  <img
                    src={`/orbit/${x.slug}.webp`}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="font-heading text-2xl font-black @2xl:text-3xl">
        {c.title}
      </p>
      <div className="mt-3 flex gap-2">
        {(
          [
            [-1, "ก่อนหน้า", ArrowLeft],
            [1, "ถัดไป", ArrowRight],
          ] as const
        ).map(([by, label, Icon]) => (
          <button
            key={by}
            type="button"
            aria-label={label}
            onClick={() => {
              setPos(pos + by);
            }}
            className="grid size-11 place-items-center rounded-md border border-(--em-ink-700) hover:bg-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            <Icon className="size-5" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}
