"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

const rows = [
  {
    e: "plan",
    t: "วางแผนจากโจทย์จริง",
    s: "คุยสั้นๆ แล้วได้แผนงานกับราคาชัดเจนในวันเดียว",
    p: ["ขอบเขตงานชัด", "ราคาคงที่"],
    tone: "from-(--em-sky-400) to-(--em-blue-700)",
  },
  {
    e: "design",
    t: "ออกแบบบนมือถือก่อน",
    s: "ทุกหน้าจอเริ่มที่จอเล็ก แล้วค่อยขยายขึ้นจอใหญ่",
    p: ["ตัวอย่างกดได้จริง", "แก้ได้ 2 รอบ"],
    tone: "from-(--em-violet-500) to-(--em-ink-950)",
  },
  {
    e: "ship",
    t: "ขึ้นระบบพร้อมคู่มือ",
    s: "ส่งมอบโค้ด เทสต์ และวิธีดูแลต่อ",
    p: ["ดูแลฟรี 30 วัน", "โค้ดเป็นของคุณ"],
    tone: "from-(--em-teal-400) to-(--em-blue-800)",
  },
];

/** Picture and text swap sides row by row; each row rises from below as it comes into view. */
export default function FeaturesAlternating() {
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-16 @3xl:py-24">
        {rows.map((r, i) => (
          <motion.div
            key={r.e}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="grid items-center gap-8 @3xl:grid-cols-2"
          >
            <div
              className={`aspect-[4/3] rounded-xl bg-linear-to-br ${r.tone} ${i % 2 ? "@3xl:order-2" : ""}`}
            />
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                0{i + 1} · {r.e}
              </p>
              <h3 className="mt-3 font-heading text-2xl font-black @3xl:text-4xl">{r.t}</h3>
              <p className="mt-3 text-muted-foreground">{r.s}</p>
              <ul className="mt-5 space-y-2">
                {r.p.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check aria-hidden className="size-4 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
