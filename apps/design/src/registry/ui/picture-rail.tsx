"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const prints = [
  {
    slug: "aurora-tide",
    title: "Aurora Tide",
    tag: "ฉบับ 3/20",
    rest: -1.2,
    details: ["Giclée บนกระดาษฝ้าย", "40 × 50 ซม.", "2026"],
  },
  {
    slug: "deep-galaxy",
    title: "Deep Galaxy",
    tag: "ฉบับ 7/12",
    rest: 0.8,
    details: ["พิมพ์บนอะลูมิเนียม", "60 × 45 ซม.", "2026"],
  },
  {
    slug: "where-globe",
    title: "Where Globe",
    tag: "ฉบับ 1/5",
    rest: -0.5,
    details: ["Giclée บนกระดาษฝ้าย", "50 × 50 ซม.", "2025"],
  },
  {
    slug: "ripple-pond",
    title: "Ripple Pond",
    tag: "ฉบับ 9/30",
    rest: 1.4,
    details: ["พิมพ์บนผ้าใบ", "40 × 60 ซม.", "2026"],
  },
  {
    slug: "tide-plasma",
    title: "Tide Plasma",
    tag: "ฉบับ 2/10",
    rest: -0.9,
    details: ["Giclée บนกระดาษฝ้าย", "30 × 40 ซม.", "2025"],
  },
];
const n = prints.length;

/** A damped swing around the rest angle; `sign` alternates so every new kick replays. */
const swing = (rest: number, amp: number, sign: number) => [
  rest,
  rest + 6 * amp * sign,
  rest - 3.5 * amp * sign,
  rest + 1.5 * amp * sign,
  rest,
];

/**
 * Framed prints hang by wires from one picture rail. Each rests a little crooked; pointing at one
 * sets it swinging from its hook and nudges its neighbours, lights it with a spot from above and
 * lifts it. Click or Enter turns it round to read the gallery label on the back. Until the visitor
 * touches anything the prints are lit one by one.
 */
export default function PictureRail({ interval = 3 }: { interval?: number }) {
  const still = useReducedMotionAfterMount();
  const [lit, setLit] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);
  const [kicks, setKicks] = useState(() => prints.map(() => ({ count: 0, amp: 0 })));

  const kick = (k: number) => {
    setKicks((ks) =>
      ks.map((x, j) => (Math.abs(j - k) > 1 ? x : { count: x.count + 1, amp: j === k ? 1 : 0.35 })),
    );
  };
  const touch = (k: number) => {
    setAuto(false);
    setLit(k);
    kick(k);
  };

  useEffect(() => {
    if (!auto || still) return;
    const t = setInterval(() => {
      setLit((l) => {
        const k = l === null ? 0 : (l + 1) % n;
        kick(k);
        return k;
      });
    }, interval * 1000);
    return () => {
      clearInterval(t);
    };
  }, [auto, still, interval]);

  const p = lit === null ? null : prints[lit];

  return (
    <section
      aria-label="ผนังภาพพิมพ์"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(null);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col justify-center overflow-clip bg-(--em-ink-200) py-10 text-(--em-ink-950)"
    >
      <p className="px-6 text-center font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
        Picture rail
      </p>

      <div className="relative mt-6">
        {/* the rail */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-1.5 border-b border-(--em-ink-400) bg-(--em-ink-300)"
        />
        <ul className="flex snap-x snap-mandatory items-start gap-8 overflow-x-auto px-[calc(50%-6rem)] pb-4 [scrollbar-width:none] @4xl:justify-center @4xl:overflow-visible @4xl:px-6">
          {prints.map((x, k) => {
            const kk = kicks[k] ?? { count: 0, amp: 0 };
            const on = lit === k;
            const flipped = open === k;
            const drop = 2.5 + (k % 2) * 1.25;
            return (
              <li key={x.slug} className="relative shrink-0 snap-center">
                <motion.div
                  initial={false}
                  animate={{
                    rotate:
                      still || kk.count === 0
                        ? x.rest
                        : swing(x.rest, kk.amp, kk.count % 2 ? 1 : -1),
                  }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  style={{ paddingTop: `${drop}rem` }}
                  className="relative origin-top"
                >
                  {/* hook and the two wires down to the frame's corners */}
                  <svg
                    aria-hidden
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    style={{ height: `${drop}rem` }}
                    className="absolute inset-x-3 top-0 w-[calc(100%-1.5rem)] stroke-(--em-ink-500)"
                  >
                    <path
                      d="M50 0 L2 40 M50 0 L98 40"
                      strokeWidth="0.8"
                      vectorEffect="non-scaling-stroke"
                      fill="none"
                    />
                  </svg>
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--em-ink-600)"
                  />

                  {/* spot from above */}
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={{ opacity: on ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="pointer-events-none absolute -inset-x-10 -top-6 bottom-0 bg-[radial-gradient(ellipse_at_50%_0%,var(--em-ink-0),transparent_70%)]"
                  />

                  <motion.button
                    type="button"
                    aria-pressed={flipped}
                    aria-label={`${x.title}${flipped ? " ด้านหลัง" : ""}`}
                    onPointerEnter={() => {
                      touch(k);
                    }}
                    onFocus={() => {
                      touch(k);
                    }}
                    onClick={() => {
                      setOpen(flipped ? null : k);
                    }}
                    initial={false}
                    animate={{ y: on ? -6 : 0, scale: on ? 1.03 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="relative block [perspective:900px] focus-visible:outline-none"
                  >
                    <motion.span
                      initial={false}
                      animate={{ rotateY: flipped ? 180 : 0 }}
                      transition={
                        still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }
                      }
                      className="relative block w-48 [transform-style:preserve-3d]"
                    >
                      {/* front: moulding, bevelled mat, print */}
                      <span
                        className={cn(
                          "block rounded-sm border-[10px] border-(--em-ink-900) bg-(--em-ink-0) p-3 shadow-[0_18px_30px_-12px] shadow-(--em-ink-975)/50 [backface-visibility:hidden]",
                          "in-focus-visible:outline-2 in-focus-visible:outline-offset-4 in-focus-visible:outline-(--em-blue-500)",
                        )}
                      >
                        <span className="block border border-(--em-ink-200) p-px">
                          <img
                            src={`/orbit/${x.slug}.webp`}
                            alt=""
                            draggable={false}
                            className="aspect-[4/5] w-full object-cover"
                          />
                        </span>
                      </span>
                      {/* back: brown paper and the gallery label */}
                      <span className="absolute inset-0 flex [transform:rotateY(180deg)] flex-col rounded-sm border-[10px] border-(--em-ink-800) bg-(--em-ink-200) p-4 text-start [backface-visibility:hidden]">
                        <span className="rounded-sm bg-(--em-ink-0) p-3 shadow-sm">
                          <span className="block text-sm font-bold">{x.title}</span>
                          {x.details.map((d) => (
                            <span key={d} className="block text-xs text-(--em-ink-600)">
                              {d}
                            </span>
                          ))}
                        </span>
                        <span className="mt-auto text-xs text-(--em-ink-600)">
                          กด Esc เพื่อหันกลับ
                        </span>
                      </span>
                    </motion.span>
                  </motion.button>

                  <span className="mx-auto mt-3 block w-fit rounded-sm bg-(--em-ink-0) px-2 py-1 text-xs text-(--em-ink-600) shadow-sm">
                    {x.tag}
                  </span>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>

      <p aria-live="polite" className="mt-2 min-h-6 px-6 text-center text-sm text-(--em-ink-600)">
        {p ? `${p.title} · ${p.tag}` : "ชี้ที่ภาพเพื่อเปิดไฟ แตะเพื่อดูป้ายด้านหลัง"}
      </p>
    </section>
  );
}
