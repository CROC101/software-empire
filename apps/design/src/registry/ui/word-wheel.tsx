"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const words = [
  { w: "ร้านกาแฟ", note: "เมนูที่อัปเดตเองได้ และสั่งล่วงหน้าก่อนไปถึง" },
  { w: "คลินิก", note: "นัดหมายออนไลน์ พร้อมเตือนก่อนถึงวัน" },
  { w: "โฮมสเตย์", note: "ปฏิทินห้องว่างที่ตรงกับทุกช่องทางจอง" },
  { w: "โรงเรียน", note: "ประกาศ ตารางเรียน และใบสมัครในที่เดียว" },
  { w: "ร้านดอกไม้", note: "สั่งช่อดอกไม้พร้อมเลือกวันส่ง" },
  { w: "สตูดิโอโยคะ", note: "จองคลาสและซื้อแพ็กเกจรายเดือน" },
  { w: "ร้านหนังสือ", note: "ค้นหาเล่ม เช็กสต็อก แล้วจองไว้รับที่ร้าน" },
  { w: "อู่ซ่อมรถ", note: "ติดตามสถานะรถ ส่งรูปให้ลูกค้าดูระหว่างซ่อม" },
  { w: "ร้านขนม", note: "พรีออเดอร์รอบอบใหม่ทุกเช้า" },
  { w: "แกลเลอรี", note: "นิทรรศการออนไลน์ที่ซูมดูรายละเอียดภาพได้" },
  { w: "ฟาร์มผัก", note: "ตะกร้าผักรายสัปดาห์ส่งถึงบ้าน" },
  { w: "ร้านซ่อมมือถือ", note: "ประเมินราคาก่อนเดินทางมาที่ร้าน" },
  { w: "ทีมฟุตบอล", note: "ตารางแข่ง ผลการแข่ง และขายบัตร" },
];
const ROW = 3.25; // rem per row

/**
 * A vertical word wheel: the centre word is sharp, its neighbours shrink and fade with distance. A
 * counter, arrows and the up/down keys step it; a side note changes with it; it turns on its own
 * until you point at it.
 */
export default function WordWheel({
  autoplay = true,
  seconds = 2.5,
}: {
  autoplay?: boolean;
  seconds?: number;
}) {
  const still = useReducedMotionAfterMount();
  const [i, setI] = useState(2);
  const [paused, setPaused] = useState(false);
  const n = words.length;
  const step = (d: number) => {
    setI((v) => (v + d + n) % n);
  };

  useEffect(() => {
    if (!autoplay || paused || still) return;
    const t = setInterval(() => {
      setI((v) => (v + 1) % n);
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [autoplay, paused, still, seconds, n]);

  const cur = words[i];

  return (
    <section
      aria-label="ประเภทงานที่เราทำ"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          step(1);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          step(-1);
        }
      }}
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="@container grid size-full min-h-[28rem] items-center gap-8 overflow-clip bg-(--em-ink-975) px-6 py-10 text-(--em-ink-50) outline-none focus-visible:ring-2 focus-visible:ring-(--em-blue-500) focus-visible:ring-inset @2xl:grid-cols-[1fr_16rem]"
    >
      <div className="flex items-center gap-6">
        <p className="hidden shrink-0 text-(--em-ink-400) @lg:block">เราทำเว็บให้</p>
        <div
          aria-hidden
          className="relative h-[16.25rem] flex-1 [mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)]"
        >
          {words.map((it, j) => {
            let d = j - i;
            if (d > n / 2) d -= n;
            if (d < -n / 2) d += n;
            const a = Math.abs(d);
            return (
              <motion.span
                key={it.w}
                initial={false}
                animate={{
                  y: `${String(d * ROW)}rem`,
                  scale: 1 - Math.min(a, 3) * 0.14,
                  opacity: a > 2 ? 0 : 1 - a * 0.4,
                }}
                transition={
                  still ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 26 }
                }
                style={{ top: `${String(2 * ROW)}rem`, height: `${String(ROW)}rem` }}
                className="absolute left-0 flex origin-left items-center font-heading text-4xl font-black whitespace-nowrap @lg:text-5xl"
              >
                {it.w}
              </motion.span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs text-(--em-ink-400) tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
        <p aria-live="polite" className="min-h-12 text-(--em-ink-200)">
          <span className="sr-only">{cur?.w}: </span>
          {cur?.note}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="ก่อนหน้า"
            onClick={() => {
              step(-1);
            }}
            className="grid size-10 place-items-center rounded-md border border-(--em-ink-800) hover:bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-blue-500)"
          >
            <ChevronUp aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label="ถัดไป"
            onClick={() => {
              step(1);
            }}
            className="grid size-10 place-items-center rounded-md border border-(--em-ink-800) hover:bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-blue-500)"
          >
            <ChevronDown aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
