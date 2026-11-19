"use client";

import { motion } from "motion/react";

const boxes = [
  {
    t: "งานเว็บ",
    s: "ออกแบบจนขึ้นระบบ",
    span: "@md:col-span-2 @md:row-span-2",
    tone: "bg-linear-to-br from-(--em-blue-600) to-(--em-blue-900)",
  },
  { t: "133", s: "ชิ้นส่วนพร้อมใช้", span: "", tone: "bg-(--em-ink-900)" },
  { t: "TH/EN", s: "สองภาษา", span: "", tone: "bg-(--em-ink-900)" },
  { t: "มือถือก่อน", s: "ทุกชิ้นลองที่ 390px", span: "@md:col-span-2", tone: "bg-(--em-ink-900)" },
  {
    t: "มืด/สว่าง",
    s: "ธีมตามคุกกี้กลาง",
    span: "",
    tone: "bg-linear-to-br from-(--em-sky-500) to-(--em-blue-700)",
  },
];

/** A bento grid that rearranges by container width; boxes rise in one after another. */
export default function BentoLayout() {
  return (
    <div className="size-full min-h-96 bg-(--em-ink-975) p-6 @container">
      <ul className="mx-auto grid max-w-2xl auto-rows-[7rem] grid-cols-2 gap-3 @md:grid-cols-4">
        {boxes.map((b, i) => (
          <motion.li
            key={b.t}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 160, damping: 20 }}
            whileHover={{ y: -4 }}
            className={`flex flex-col justify-end rounded-xl border border-(--em-ink-800) p-4 ${b.span} ${b.tone} ${i === 0 ? "col-span-2" : ""}`}
          >
            <p className="font-heading text-2xl font-black text-(--em-ink-50)">{b.t}</p>
            <p className="text-sm text-(--em-ink-200)">{b.s}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
