"use client";

import { motion } from "motion/react";

const steps = [
  { t: "คุยโจทย์", s: "30 นาที ฟรี" },
  { t: "เสนอแผนและราคา", s: "ภายใน 1 วัน" },
  { t: "ออกแบบ", s: "ตัวอย่างกดได้จริง" },
  { t: "พัฒนาและทดสอบ", s: "อัปเดตทุกสัปดาห์" },
  { t: "ขึ้นระบบ", s: "พร้อมคู่มือ" },
];

/** Numbered steps joined by a line that draws itself across (or down, on narrow screens) when seen. */
export default function StepsTimeline() {
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <h2 className="font-heading text-3xl font-black @3xl:text-5xl">ทำงานกันอย่างไร</h2>
        <ol className="relative mt-12 grid gap-8 @3xl:grid-cols-5 @3xl:gap-4">
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute top-5 right-[10%] left-[10%] hidden h-0.5 origin-left bg-primary @3xl:block"
          />
          <motion.span
            aria-hidden
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute top-5 bottom-5 left-5 w-0.5 origin-top bg-primary @3xl:hidden"
          />
          {steps.map((s, i) => (
            <motion.li
              key={s.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.15 }}
              className="relative flex items-start gap-4 @3xl:flex-col @3xl:items-center @3xl:text-center"
            >
              <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 border-primary bg-background font-mono font-bold text-primary">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{s.t}</span>
                <span className="text-sm text-muted-foreground">{s.s}</span>
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
