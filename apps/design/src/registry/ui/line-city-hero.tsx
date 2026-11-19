"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

// x, width, height of each tower on a 600 x 200 drawing; windows are drawn from these
const towers = [
  [10, 46, 90],
  [62, 34, 130],
  [102, 58, 70],
  [166, 40, 160],
  [212, 70, 110],
  [288, 36, 180],
  [330, 60, 95],
  [396, 44, 140],
  [446, 66, 80],
  [518, 30, 120],
  [554, 38, 75],
] as const;

const words = ["ทำเว็บให้", "ธุรกิจในเมือง", "ที่ไม่อยากเหมือนใคร"];

/**
 * A hero over a line-drawn skyline. Towers rise from the street one by one, the headline comes up
 * line by line, and the key numbers get a marker swipe. SVG strokes in currentColor, so the drawing
 * follows the theme; motion is transform and opacity only.
 */
export default function LineCityHero({ cta = "เริ่มโปรเจกต์" }: { cta?: string }) {
  const still = useReducedMotionAfterMount();
  const t = (delay: number) =>
    still ? { duration: 0 } : { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section className="@container relative overflow-clip bg-background text-foreground">
      <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-8 @lg:pt-28">
        <h1 className="font-heading text-4xl font-black @lg:text-6xl">
          {words.map((w, i) => (
            <span key={w} className="block overflow-clip pb-1">
              <motion.span
                className={`inline-block ${i === 1 ? "text-(--em-blue-600) dark:text-(--em-sky-400)" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={t(0.1 + i * 0.12)}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          ส่งงานแล้ว{" "}
          <span className="relative inline-block font-semibold text-foreground">
            <motion.span
              aria-hidden
              className="absolute inset-x-0 bottom-0.5 -z-0 h-2 origin-left bg-(--em-sky-400)/40"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={t(0.7)}
            />
            <span className="relative">48 โปรเจกต์</span>
          </span>{" "}
          ใน 6 ปี เฉลี่ยเปิดใช้จริงภายใน{" "}
          <span className="relative inline-block font-semibold text-foreground">
            <motion.span
              aria-hidden
              className="absolute inset-x-0 bottom-0.5 h-2 origin-left bg-(--em-sky-400)/40"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={t(0.85)}
            />
            <span className="relative">5 สัปดาห์</span>
          </span>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {cta}
            <ArrowRight aria-hidden className="size-4" />
          </a>
          <a
            href="#work"
            className="rounded-lg border border-border px-5 py-2.5 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            ดูผลงาน
          </a>
        </div>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 600 200"
        className="block w-full text-foreground/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        {towers.map(([x, w, h], i) => (
          <motion.g
            key={x}
            initial={{ y: h, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={t(0.3 + i * 0.06)}
          >
            <rect x={x} y={200 - h} width={w} height={h} />
            {Array.from({ length: Math.floor((h - 16) / 18) }, (_, r) => (
              <line
                key={r}
                x1={x + 6}
                x2={x + w - 6}
                y1={200 - h + 14 + r * 18}
                y2={200 - h + 14 + r * 18}
                strokeDasharray="4 5"
              />
            ))}
          </motion.g>
        ))}
        <line x1="0" x2="600" y1="199.5" y2="199.5" />
      </svg>
    </section>
  );
}
