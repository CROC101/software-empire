"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const events = [
  { when: "ม.ค.", title: "เริ่มโปรเจกต์", text: "เก็บความต้องการ วางโครง" },
  { when: "มี.ค.", title: "ออกแบบเสร็จ", text: "ระบบสี ฟอนต์ ชิ้นส่วนครบ" },
  { when: "มิ.ย.", title: "เปิดทดสอบ", text: "ผู้ใช้ 120 คนแรกเข้ามาลอง" },
  { when: "ก.ย.", title: "เปิดตัวจริง", text: "ขึ้นระบบ พร้อมรับงาน" },
];

/** A vertical timeline; the glow travels down one event at a time and the line fills behind it. */
export default function Timeline() {
  const [at, setAt] = useState(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => {
      setAt((a) => (a + 1) % events.length);
    }, 1800);
    return () => {
      clearInterval(t);
    };
  }, [still]);
  return (
    <div className="grid size-full min-h-96 place-items-center bg-(--em-ink-975) p-6">
      <ol className="relative w-full max-w-xs">
        <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-(--em-ink-800)" />
        <motion.span
          aria-hidden
          className="absolute top-2 bottom-2 left-[7px] w-0.5 origin-top bg-(--em-sky-400)"
          animate={{ scaleY: at / (events.length - 1) }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
        {events.map((e, i) => (
          <li
            key={e.title}
            className="relative pb-6 pl-8 last:pb-0"
            aria-current={i === at ? "step" : undefined}
          >
            <motion.span
              aria-hidden
              className="absolute top-1 left-0 size-4 rounded-full border-2 border-(--em-ink-700) bg-(--em-ink-900)"
              animate={{ scale: i === at ? 1.25 : 1 }}
            >
              <motion.span
                className="absolute -inset-0.5 rounded-full bg-(--em-sky-400)"
                animate={{ opacity: i <= at ? 1 : 0 }}
              />
            </motion.span>
            <p className="font-mono text-xs text-(--em-ink-400)">{e.when}</p>
            <p
              className={`font-semibold ${i === at ? "text-(--em-ink-50)" : "text-(--em-ink-300)"}`}
            >
              {e.title}
            </p>
            <p className="text-sm text-(--em-ink-400)">{e.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
