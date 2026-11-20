"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { motion } from "motion/react";

const ease = [0.65, 0, 0.35, 1] as const;

/** One cone of light: bright along both edges, dimmer in the middle, fading out downward */
const cone =
  "conic-gradient(at 50% 0%, transparent 0deg 112deg, var(--em-sky-400) 124deg, color-mix(in oklab, var(--em-blue-500) 35%, transparent) 150deg, transparent 172deg 188deg, color-mix(in oklab, var(--em-blue-500) 35%, transparent) 210deg, var(--em-sky-400) 236deg, transparent 248deg 360deg)";

/**
 * A dark hero lit from above: a thin bar of light opens out sideways and throws a cone of light
 * down onto the headline. It switches on each time it comes into view (transform and opacity only)
 * and is already on under reduced motion.
 */
export default function LampHero({
  title = "เปิดไฟให้งานที่ทำ",
  seconds = 0.9,
}: {
  title?: string;
  seconds?: number;
}) {
  const still = useReducedMotionAfterMount();
  const on = { opacity: 1, scaleX: 1 };
  const play = still ? { duration: 0 } : { delay: 0.2, duration: seconds, ease };
  const from = (scaleX: number) => (still ? on : { opacity: 0.4, scaleX });

  return (
    <section className="@container relative isolate grid size-full min-h-[36rem] place-items-center overflow-clip bg-(--em-ink-975) text-(--em-ink-50)">
      <div aria-hidden className="absolute inset-x-0 top-[22%] -z-10 flex justify-center">
        {/* the cone */}
        <motion.div
          initial={from(0.5)}
          whileInView={on}
          viewport={{ amount: 0.4 }}
          transition={play}
          className="absolute top-0 h-72 w-[min(60rem,140%)] origin-top [mask-image:linear-gradient(to_bottom,black_15%,transparent)]"
          style={{ backgroundImage: cone }}
        />
        {/* the glow round the bar, then the bar itself */}
        <motion.div
          initial={from(0.4)}
          whileInView={on}
          viewport={{ amount: 0.4 }}
          transition={play}
          className="absolute -top-16 h-32 w-[min(28rem,80%)] rounded-full bg-(--em-blue-500)/50 blur-3xl"
        />
        <motion.div
          initial={from(0.5)}
          whileInView={on}
          viewport={{ amount: 0.4 }}
          transition={play}
          className="absolute top-0 h-0.5 w-[min(30rem,80%)] bg-(--em-sky-400)"
        />
        {/* dark above the bar so the light only falls downward */}
        <div className="absolute bottom-0 h-64 w-full bg-(--em-ink-975)" />
      </div>

      <motion.div
        initial={still ? false : { opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.4 }}
        transition={still ? { duration: 0 } : { delay: 0.35, duration: seconds, ease }}
        className="mt-40 flex max-w-2xl flex-col items-center px-6 text-center"
      >
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
          Spotlight
        </p>
        <h1 className="mt-4 font-heading text-4xl leading-tight font-black @2xl:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-(--em-ink-300)">
          แถบไฟเปิดออกสองข้าง ส่องลงมาที่หัวเรื่องตรงกลาง ข้อความลอยขึ้นมารับแสง
        </p>
        <a
          href="#start"
          className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-(--em-ink-50) px-5 font-semibold text-(--em-ink-975) transition-transform hover:-translate-y-0.5"
        >
          เริ่มเลย
        </a>
      </motion.div>
    </section>
  );
}
