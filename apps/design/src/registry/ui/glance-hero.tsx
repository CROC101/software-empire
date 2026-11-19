"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const facts = [
  { k: "โปรเจกต์ที่ส่ง", v: "48" },
  { k: "ลูกค้ากลับมาจ้างซ้ำ", v: "70%" },
  { k: "วันเฉลี่ยถึงเปิดใช้", v: "35" },
];

/** One digit on a reel: 0-9 stacked, slid into place with transform. Other characters stay still */
function Reel({ ch, on, delay }: { ch: string; on: boolean; delay: number }) {
  const still = useReducedMotionAfterMount();
  const d = Number(ch);
  if (!/\d/.test(ch)) return <span>{ch}</span>;
  return (
    <span className="relative inline-block h-[1em] overflow-clip leading-none">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${String(-(on ? d : 0) * 10)}%` }}
        transition={still ? { duration: 0 } : { duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em]">
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * A dark hero with two actions and a picture panel. A frosted "at a glance" card sits on the picture:
 * its rows rise in and each number rolls up on digit reels once the card is on screen.
 */
export default function GlanceHero({
  title = "ทำเว็บที่ลูกค้าคุณกลับมาใช้ซ้ำ",
}: {
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const still = useReducedMotionAfterMount();
  const on = seen || still;

  return (
    <section className="@container bg-(--em-ink-975) px-4 py-16 text-(--em-ink-50) @lg:px-8 @lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 @3xl:grid-cols-2">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-ink-400) uppercase">Studio</p>
          <h1 className="mt-4 font-heading text-4xl font-black @lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-lg text-(--em-ink-300)">
            สตูดิโอสี่คนที่ออกแบบ เขียนโค้ด และดูแลต่อหลังเปิดใช้ โดยทีมเดิมตั้งแต่วันแรก
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-lg bg-(--em-blue-600) px-5 py-2.5 font-semibold text-(--em-ink-0) hover:bg-(--em-blue-700) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-400)"
            >
              นัดคุยงาน
              <ArrowRight aria-hidden className="size-4" />
            </a>
            <a
              href="#work"
              className="rounded-lg border border-(--em-ink-700) px-5 py-2.5 font-semibold hover:bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--em-blue-400)"
            >
              ดูผลงาน
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-clip rounded-xl bg-linear-to-b from-(--em-blue-800) via-(--em-blue-600) to-(--em-sky-400) @3xl:aspect-[4/5]">
          <span
            aria-hidden
            className="absolute top-8 right-10 size-14 rounded-full bg-(--em-ink-50)"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-(--em-ink-900)/70 [clip-path:polygon(0_100%,0_40%,18%_15%,36%_45%,58%_5%,78%_40%,100%_20%,100%_100%)]"
          />
          <div
            ref={ref}
            className="absolute inset-x-4 bottom-4 rounded-lg border border-(--em-ink-50)/20 bg-(--em-ink-975)/40 p-5 backdrop-blur-md @lg:inset-x-6 @lg:bottom-6"
          >
            <p className="text-sm text-(--em-ink-300)">ดูแบบรวบรัด</p>
            <dl className="mt-3 grid gap-2">
              {facts.map((f, i) => (
                <motion.div
                  key={f.k}
                  initial={false}
                  animate={on ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
                  transition={still ? { duration: 0 } : { duration: 0.5, delay: i * 0.12 }}
                  className="flex items-baseline justify-between border-t border-(--em-ink-50)/15 pt-2"
                >
                  <dt className="text-sm">{f.k}</dt>
                  <dd className="font-heading text-2xl font-black tabular-nums" aria-label={f.v}>
                    <span aria-hidden>
                      {Array.from(f.v, (ch, j) => (
                        <Reel key={j} ch={ch} on={on} delay={0.2 + i * 0.12 + j * 0.08} />
                      ))}
                    </span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
