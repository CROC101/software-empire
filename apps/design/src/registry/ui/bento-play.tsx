"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { Check, Flag } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const chips = [
  { t: "ดีไซน์", x: -70, y: -40 },
  { t: "โค้ด", x: 80, y: -30 },
  { t: "ข้อมูล", x: -60, y: 46 },
  { t: "ทดสอบ", x: 70, y: 40 },
];
const options = [
  { t: "ส่งไฟล์ทางอีเมล", wrong: true },
  { t: "แชร์ลิงก์ที่หมดอายุเองได้", wrong: false },
  { t: "อัปโหลดลงไดรฟ์สาธารณะ", wrong: true },
];
const reviews = ["หน้าแรกโหลดช้าบนมือถือ", "ปุ่มชำระเงินสีจาง", "ฟอร์มสมัครไม่มีป้ายช่อง"];

const card =
  "relative overflow-clip rounded-xl border border-(--em-ink-800) bg-(--em-ink-900) p-5 @lg:p-6";

/**
 * A dark bento of four cards, each holding a tiny working UI that plays once the grid scrolls into
 * view: chips gather round a focus, a person card rises, wrong options get struck out, and a flagged
 * review resolves. Transform and opacity only; reduced motion shows every end state.
 */
export default function BentoPlay() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  const still = useReducedMotionAfterMount();
  const on = seen || still;
  const t = (delay: number) =>
    still ? { duration: 0 } : { duration: 0.6, delay, ease: "easeOut" as const };

  return (
    <section className="@container bg-(--em-ink-975) px-4 py-16 text-(--em-ink-50) @lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl font-black @lg:text-4xl">ทำงานเป็นทีมเดียว</h2>
        <p className="mt-3 max-w-xl text-(--em-ink-400)">
          สี่อย่างที่ทีมเราใช้ทุกวัน เล่นให้ดูในกล่องเล็ก ๆ
        </p>

        <div ref={ref} className="mt-10 grid gap-4 @2xl:grid-cols-3">
          <div className={`${card} @2xl:col-span-2`}>
            <p className="font-semibold">ทุกสายงานมารวมที่เดียว</p>
            <div className="relative mt-6 grid h-40 place-items-center">
              <span className="z-10 rounded-lg bg-(--em-blue-600) px-4 py-2 text-sm font-semibold text-(--em-ink-0)">
                งานของคุณ
              </span>
              {chips.map((c, i) => (
                <motion.span
                  key={c.t}
                  initial={false}
                  animate={
                    on
                      ? { x: c.x * 0.55, y: c.y * 0.55, opacity: 1 }
                      : { x: c.x * 1.6, y: c.y * 1.4, opacity: 0 }
                  }
                  transition={t(0.15 * i)}
                  className="absolute rounded-full border border-(--em-ink-700) bg-(--em-ink-850) px-3 py-1 text-xs"
                >
                  {c.t}
                </motion.span>
              ))}
            </div>
          </div>

          <div className={card}>
            <p className="font-semibold">รู้ว่าใครดูแลอะไร</p>
            <motion.div
              initial={false}
              animate={on ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
              transition={t(0.2)}
              className="mt-6 flex items-center gap-3 rounded-lg border border-(--em-ink-700) bg-(--em-ink-850) p-3"
            >
              <span className="grid size-10 place-items-center rounded-full bg-(--em-blue-700) text-sm font-semibold">
                พร
              </span>
              <span>
                <span className="block text-sm font-semibold">พรรณี</span>
                <span className="block text-xs text-(--em-ink-400)">ดูแลระบบชำระเงิน</span>
              </span>
            </motion.div>
          </div>

          <div className={card}>
            <p className="font-semibold">ตัดทางที่ไม่ใช่ออกก่อน</p>
            <ul className="mt-6 grid gap-2 text-sm">
              {options.map((o, i) => (
                <li
                  key={o.t}
                  className="relative rounded-md border border-(--em-ink-700) px-3 py-2"
                >
                  <motion.span
                    initial={false}
                    animate={{ opacity: on && o.wrong ? 0.45 : 1 }}
                    transition={t(0.4 + 0.25 * i)}
                  >
                    {o.t}
                  </motion.span>
                  {o.wrong && (
                    <motion.span
                      aria-hidden
                      initial={false}
                      animate={{ scaleX: on ? 1 : 0 }}
                      transition={t(0.4 + 0.25 * i)}
                      className="absolute inset-x-3 top-1/2 h-px origin-left bg-(--em-ink-300)"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${card} @2xl:col-span-2`}>
            <p className="font-semibold">รีวิวปิดได้ในที่เดียว</p>
            <ul className="mt-6 grid gap-2 text-sm">
              {reviews.map((r, i) => (
                <li
                  key={r}
                  className="flex items-center gap-3 rounded-md border border-(--em-ink-700) bg-(--em-ink-850) px-3 py-2"
                >
                  <span className="relative grid size-5 place-items-center">
                    <motion.span
                      initial={false}
                      animate={{ opacity: on ? 0 : 1, scale: on ? 0.5 : 1 }}
                      transition={t(0.6 + 0.3 * i)}
                      className="absolute"
                    >
                      <Flag aria-hidden className="size-4 text-(--em-ink-400)" />
                    </motion.span>
                    <motion.span
                      initial={false}
                      animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.5 }}
                      transition={t(0.6 + 0.3 * i)}
                      className="absolute"
                    >
                      <Check aria-hidden className="size-4 text-(--em-sky-400)" />
                    </motion.span>
                  </span>
                  <span className="flex-1">{r}</span>
                  <span className="text-xs text-(--em-ink-400)">{on ? "แก้แล้ว" : "รอแก้"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
