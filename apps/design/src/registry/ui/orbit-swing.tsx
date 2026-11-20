"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Slide = {
  slug: string;
  thin: string;
  heavy: string;
  blurb: string;
  tags: string[];
  /** arc colour behind the disc */
  tone: string;
};

const slides: Slide[] = [
  {
    slug: "aurora-tide",
    thin: "Aurora",
    heavy: "Tide",
    blurb: "แสงเหนือไหลเป็นคลื่นช้า ๆ อยู่หลังหัวเรื่อง",
    tags: ["shader", "พื้นหลัง"],
    tone: "--em-sky-400",
  },
  {
    slug: "deep-galaxy",
    thin: "Deep",
    heavy: "Galaxy",
    blurb: "ดาวนับพันหมุนเป็นแขนกาแล็กซี ลากแล้วเอียงตาม",
    tags: ["อนุภาค", "WebGL"],
    tone: "--em-blue-500",
  },
  {
    slug: "where-globe",
    thin: "Where",
    heavy: "Globe",
    blurb: "ลูกโลกจุดหมุนช้า ๆ มีเส้นโค้งโยงเมืองที่เลือก",
    tags: ["แผนที่", "3D"],
    tone: "--em-blue-300",
  },
  {
    slug: "warp-lanes",
    thin: "Warp",
    heavy: "Lanes",
    blurb: "เส้นแสงพุ่งผ่านกล้องเหมือนเดินทางเร็วกว่าแสง",
    tags: ["ลูกเล่น", "canvas"],
    tone: "--em-blue-700",
  },
  {
    slug: "ripple-pond",
    thin: "Ripple",
    heavy: "Pond",
    blurb: "แตะผิวน้ำแล้วระลอกกระจายออกจากจุดที่แตะ",
    tags: ["น้ำ", "สัมผัส"],
    tone: "--em-sky-500",
  },
];

const ease = [0.65, 0, 0.35, 1] as const;

/**
 * Orbit swing carousel: each picture rides a wide orbit whose pivot sits far above the stage, so
 * the old one swings out to one side as the next swings in from the other. The two-weight title
 * wipes (thin line from the right, heavy line from the left), the card cross-fades and an arc
 * behind the disc turns and takes the slide's colour. Arrows, dots, thumbnails, arrow keys and a
 * sideways swipe all step; time-driven only, still under reduced motion.
 */
export default function OrbitSwing({ tilt = 45 }: { tilt?: number }) {
  const still = useReducedMotionAfterMount();
  const [[i, dir], set] = useState<[number, number]>([0, 1]);
  const n = slides.length;
  const s = slides[i] ?? slides[0];
  if (!s) return null;
  const go = (to: number) => {
    const k = (to + n) % n;
    if (k !== i) set([k, to > i ? 1 : -1]);
  };
  const t = still ? { duration: 0 } : { duration: 0.8, ease };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="ชิ้นงานเด่น"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        else if (e.key === "ArrowLeft") go(i - 1);
      }}
      className="@container relative isolate grid size-full min-h-[36rem] overflow-clip bg-(--em-ink-50) text-(--em-ink-950) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-blue-500)"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-10 @3xl:grid-cols-2">
        {/* words */}
        <div className="order-2 @3xl:order-1">
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </p>
          <h2 className="mt-3 font-heading text-5xl leading-none @2xl:text-7xl">
            <span className="grid overflow-clip">
              <AnimatePresence initial={false}>
                <motion.span
                  key={s.thin}
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={t}
                  className="col-start-1 row-start-1 font-light"
                >
                  {s.thin}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="grid overflow-clip">
              <AnimatePresence initial={false}>
                <motion.span
                  key={s.heavy}
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={still ? t : { ...t, delay: 0.06 }}
                  className="col-start-1 row-start-1 font-black text-(--em-blue-600)"
                >
                  {s.heavy}
                </motion.span>
              </AnimatePresence>
            </span>
          </h2>

          <div className="mt-6 grid">
            <AnimatePresence initial={false}>
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={still ? t : { duration: 0.45, ease }}
                className="col-start-1 row-start-1 flex max-w-sm items-center gap-3 rounded-xl border border-(--em-ink-200) bg-(--em-ink-0) p-3 shadow-sm"
              >
                <img
                  src={`/orbit/${s.slug}.webp`}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-(--em-ink-600)">{s.blurb}</p>
                  <p className="mt-1 flex gap-1">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-(--em-blue-50) px-2 py-0.5 text-xs text-(--em-blue-700)"
                      >
                        {tag}
                      </span>
                    ))}
                  </p>
                </div>
                <a
                  href={`/c/${s.slug}`}
                  aria-label={`เปิด ${s.thin} ${s.heavy}`}
                  className="grid size-11 shrink-0 place-items-center rounded-md text-(--em-blue-600) hover:bg-(--em-blue-50)"
                >
                  <ArrowRight className="size-5" aria-hidden />
                </a>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {(
              [
                [-1, "ก่อนหน้า", ArrowLeft],
                [1, "ถัดไป", ArrowRight],
              ] as const
            ).map(([d, label, Icon]) => (
              <button
                key={d}
                type="button"
                aria-label={label}
                onClick={() => {
                  go(i + d);
                }}
                className="grid size-11 place-items-center rounded-md border border-(--em-ink-200) hover:bg-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-blue-500)"
              >
                <Icon className="size-5" aria-hidden />
              </button>
            ))}
            <span className="ms-2 flex">
              {slides.map((x, k) => (
                <button
                  key={x.slug}
                  type="button"
                  aria-label={`${x.thin} ${x.heavy}`}
                  aria-current={k === i}
                  onClick={() => {
                    go(k);
                  }}
                  className="grid size-6 place-items-center"
                >
                  <span
                    className={cn(
                      "block size-2 rounded-full transition-transform duration-300",
                      k === i ? "scale-150 bg-(--em-blue-600)" : "bg-(--em-ink-300)",
                    )}
                  />
                </button>
              ))}
            </span>
          </div>
        </div>

        {/* stage: the arc, then the disc on its orbit */}
        <motion.div
          className="relative order-1 mx-auto aspect-square w-full max-w-[26rem] touch-pan-y @3xl:order-2"
          onPanEnd={(_, { offset }) => {
            if (Math.abs(offset.x) > 50) go(i + (offset.x < 0 ? 1 : -1));
          }}
        >
          <motion.svg
            viewBox="0 0 100 100"
            aria-hidden
            animate={{ rotate: i * 72 }}
            transition={still ? { duration: 0 } : { duration: 1, ease }}
            className="absolute -inset-[8%] size-[116%]"
          >
            <AnimatePresence initial={false}>
              <motion.circle
                key={s.tone}
                cx="50"
                cy="50"
                r="46"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="120 300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={t}
                style={{ stroke: `var(${s.tone})` }}
              />
            </AnimatePresence>
          </motion.svg>
          <AnimatePresence initial={false} custom={dir}>
            <motion.img
              key={s.slug}
              src={`/orbit/${s.slug}.webp`}
              alt={`${s.thin} ${s.heavy}`}
              draggable={false}
              custom={dir}
              variants={{
                enter: (d: number) => ({ rotate: d * tilt, opacity: 0 }),
                center: { rotate: 0, opacity: 1 },
                exit: (d: number) => ({ rotate: -d * tilt, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={still ? { duration: 0 } : { duration: 0.9, ease }}
              style={{ transformOrigin: "50% -140%" }}
              className="absolute inset-[6%] size-[88%] rounded-full border-8 border-(--em-ink-0) object-cover shadow-xl select-none"
            />
          </AnimatePresence>
        </motion.div>
      </div>

      {/* thumbnails */}
      <div className="mx-auto flex max-w-full gap-2 self-end overflow-x-auto px-6 pb-6">
        {slides.map((x, k) => (
          <button
            key={x.slug}
            type="button"
            aria-label={`ไปที่ ${x.thin} ${x.heavy}`}
            onClick={() => {
              go(k);
            }}
            className={cn(
              "size-12 shrink-0 overflow-clip rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-(--em-blue-500)",
              k === i
                ? "border-(--em-blue-600)"
                : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <img src={`/orbit/${x.slug}.webp`} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {`${s.thin} ${s.heavy}, ${String(i + 1)} จาก ${String(n)}`}
      </p>
    </section>
  );
}
