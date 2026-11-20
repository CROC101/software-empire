"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const projects = [
  {
    slug: "where-globe",
    name: "Where Globe",
    kind: "แผนที่สด",
    year: "2026",
    tone: "--em-blue-600",
  },
  {
    slug: "aurora-tide",
    name: "Aurora Tide",
    kind: "Shader พื้นหลัง",
    year: "2026",
    tone: "--em-sky-500",
  },
  {
    slug: "ripple-pond",
    name: "Ripple Pond",
    kind: "ผิวน้ำโต้ตอบ",
    year: "2025",
    tone: "--em-blue-500",
  },
  {
    slug: "particle-title",
    name: "Particle Title",
    kind: "ตัวอักษรอนุภาค",
    year: "2025",
    tone: "--em-blue-700",
  },
  {
    slug: "warp-lanes",
    name: "Warp Lanes",
    kind: "Canvas เส้นแสง",
    year: "2025",
    tone: "--em-sky-400",
  },
];
const n = projects.length;

/**
 * Project cards that deal onto one stack: each new card rises from below and lands on top; the
 * cards it covers sink back and lift a little so their edges stay readable as a pile. The visit
 * button sits in a notch cut from the card's corner. Steps on its own until touched; buttons,
 * arrow keys or a vertical swipe deal and take back. Never tied to page scroll.
 */
export default function ProjectDeck({ seconds = 3.5 }: { seconds?: number }) {
  const still = useReducedMotionAfterMount();
  const [top, setTop] = useState(0);
  const [auto, setAuto] = useState(true);
  const go = (to: number) => {
    setAuto(false);
    setTop(Math.max(0, Math.min(n - 1, to)));
  };

  useEffect(() => {
    if (!auto || still) return;
    const t = setInterval(() => {
      setTop((x) => (x + 1) % n);
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [auto, still, seconds]);

  const p = projects[top] ?? projects[0];
  if (!p) return null;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="กองโปรเจกต์"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") go(top + 1);
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(top - 1);
      }}
      className="@container relative isolate grid size-full min-h-[36rem] overflow-clip bg-(--em-ink-50) text-(--em-ink-950) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-blue-500)"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-10 @3xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            Selected work
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none font-black @2xl:text-6xl">
            งานที่ทำ
          </h2>
          <p aria-live="polite" className="mt-4 text-(--em-ink-600)">
            <span className="font-bold text-(--em-ink-950)">{p.name}</span> · {p.kind} · {p.year}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {(
              [
                [-1, "ใบก่อน", ArrowUp],
                [1, "ใบถัดไป", ArrowDown],
              ] as const
            ).map(([by, label, Icon]) => (
              <button
                key={by}
                type="button"
                aria-label={label}
                disabled={(by < 0 && top === 0) || (by > 0 && top === n - 1)}
                onClick={() => {
                  go(top + by);
                }}
                className="grid size-11 place-items-center rounded-md border border-(--em-ink-200) hover:bg-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-blue-500) disabled:opacity-40"
              >
                <Icon className="size-5" aria-hidden />
              </button>
            ))}
            <span className="ms-2 font-mono text-xs text-(--em-ink-500) tabular-nums">
              {String(top + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
          </div>
        </div>

        <motion.div
          className="relative aspect-[5/4] w-full touch-pan-x"
          onPanEnd={(_, { offset }) => {
            if (Math.abs(offset.y) > 40) go(top + (offset.y < 0 ? 1 : -1));
          }}
        >
          {projects.map((x, k) => {
            const under = top - k; // how many cards lie on top of this one
            const dealt = k <= top;
            return (
              <motion.article
                key={x.slug}
                aria-hidden={k !== top}
                initial={false}
                animate={
                  dealt
                    ? {
                        y: `${-Math.min(under, 3) * 4}%`,
                        scale: 1 - Math.min(under, 3) * 0.05,
                        opacity: under > 3 ? 0 : 1,
                      }
                    : { y: "115%", scale: 1, opacity: 0 }
                }
                transition={
                  still ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }
                }
                style={{ zIndex: k }}
                className="absolute inset-0 origin-top overflow-clip rounded-xl bg-(--em-ink-975) shadow-[0_-12px_30px_-18px] shadow-(--em-ink-975)/60"
              >
                <img
                  src={`/orbit/${x.slug}.webp`}
                  alt=""
                  draggable={false}
                  className="size-full object-cover"
                />
                <span
                  aria-hidden
                  style={{ background: `var(${x.tone})` }}
                  className="absolute inset-x-0 top-0 h-1"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-(--em-ink-975)/85 to-transparent p-5 pe-24 text-(--em-ink-0)">
                  <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
                    {x.year}
                  </p>
                  <p className="font-heading text-2xl font-black @2xl:text-3xl">{x.name}</p>
                </div>
                {/* the notch: page ground cut into the corner, holding the visit button */}
                <span className="absolute end-0 bottom-0 rounded-ss-xl bg-(--em-ink-50) ps-2 pt-2">
                  <a
                    href="#"
                    tabIndex={k === top ? 0 : -1}
                    aria-label={`เปิด ${x.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    className="grid size-14 place-items-center rounded-xl bg-(--em-blue-600) text-(--em-ink-0) hover:bg-(--em-blue-700) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-500)"
                  >
                    <ArrowUpRight className="size-6" aria-hidden />
                  </a>
                </span>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
