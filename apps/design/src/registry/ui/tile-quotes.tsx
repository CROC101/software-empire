"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const quotes = [
  {
    text: "ทีมถามคำถามที่เราไม่เคยคิดจะถามตัวเอง เว็บใหม่เลยตอบลูกค้าได้ตรงกว่าเดิมมาก",
    name: "กนกพร สายชล",
    role: "เจ้าของร้านกาแฟ",
  },
  {
    text: "ส่งงานตามนัดทุกรอบ และอธิบายสิ่งที่ทำเป็นภาษาคนทั่วไป ไม่ต้องเดาศัพท์",
    name: "ปิติ ทองดี",
    role: "ผู้จัดการคลินิก",
  },
  {
    text: "หลังเปิดเว็บสองเดือน ยอดจองผ่านเว็บแซงยอดจองทางโทรศัพท์แล้ว",
    name: "มยุรี ศรีสุข",
    role: "เจ้าของโฮมสเตย์",
  },
];
const tiles = ["กส", "ปท", "มศ", "วร", "ชน", "อภ", "สม", "ธน", "รพ", "ณก", "จต", "พล"];
const tone = ["bg-(--em-blue-700)", "bg-(--em-ink-800)", "bg-(--em-blue-500)", "bg-(--em-ink-700)"];

/**
 * Testimonials beside a wall of customer tiles: three columns of initials slide slowly in opposite
 * directions (CSS loop, paused under reduced motion), and the quote steps with the arrows.
 */
export default function TileQuotes() {
  const still = useReducedMotionAfterMount();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d: number) => {
    setDir(d);
    setI((v) => (v + d + quotes.length) % quotes.length);
  };
  const q = quotes[i] ?? { text: "", name: "", role: "" };

  return (
    <section className="@container overflow-clip bg-background px-4 py-16 text-foreground @lg:px-8">
      <style>{`@keyframes tq-up{to{transform:translateY(-50%)}}@keyframes tq-down{from{transform:translateY(-50%)}to{transform:translateY(0)}}.tq-up{animation:tq-up 24s linear infinite}.tq-down{animation:tq-down 28s linear infinite}@media (prefers-reduced-motion:reduce){.tq-up,.tq-down{animation:none}}`}</style>
      <div className="mx-auto grid max-w-5xl items-center gap-10 @3xl:grid-cols-[1fr_1.2fr]">
        <div
          aria-hidden
          className="grid h-72 grid-cols-3 gap-3 overflow-clip [mask-image:linear-gradient(transparent,black_20%,black_80%,transparent)] @3xl:h-96"
        >
          {[0, 1, 2].map((c) => (
            <div key={c} className={`vt-live flex flex-col gap-3 ${c === 1 ? "tq-down" : "tq-up"}`}>
              {[...tiles, ...tiles].map((t, j) => (
                <span
                  key={j}
                  className={`grid aspect-square place-items-center rounded-lg font-semibold text-(--em-ink-50) ${tone[(j + c) % tone.length] ?? ""}`}
                >
                  {tiles[(j + c * 4) % tiles.length]}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">ลูกค้าพูดถึงเรา</p>
          <div className="relative mt-4 min-h-56 @lg:min-h-48" aria-live="polite">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.figure
                key={i}
                custom={dir}
                initial={still ? false : { opacity: 0, x: dir * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={
                  still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: dir * -24 }
                }
                transition={{ duration: 0.35 }}
              >
                <blockquote className="font-heading text-2xl font-black @lg:text-3xl">
                  “{q.text}”
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{q.name}</span>
                  <span className="text-muted-foreground"> · {q.role}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              aria-label="รีวิวก่อนหน้า"
              onClick={() => {
                go(-1);
              }}
              className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              aria-label="รีวิวถัดไป"
              onClick={() => {
                go(1);
              }}
              className="grid size-10 place-items-center rounded-md border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
            <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
              {String(i + 1).padStart(2, "0")} / {String(quotes.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
