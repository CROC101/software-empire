"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

const tiers = [
  {
    n: "เริ่มต้น",
    m: 0,
    y: 0,
    d: "ลองใช้ก่อน ไม่ต้องผูกบัตร",
    f: ["1 โปรเจกต์", "ชิ้นส่วนพื้นฐาน", "ชุมชนช่วยตอบ"],
  },
  {
    n: "โปร",
    m: 490,
    y: 390,
    d: "สำหรับฟรีแลนซ์และทีมเล็ก",
    f: ["ไม่จำกัดโปรเจกต์", "ชิ้นส่วนทั้งหมด", "เทมเพลตเต็มหน้า", "ตอบภายใน 24 ชม."],
    hot: true,
  },
  {
    n: "ทีม",
    m: 1490,
    y: 1190,
    d: "หลายคน หลายแบรนด์",
    f: ["ทุกอย่างในโปร", "สิทธิ์ตามบทบาท", "ระบบดีไซน์ของแบรนด์"],
  },
];

/** Three plans with a monthly/yearly switch; the price swaps with a short rise and the middle plan is lifted. */
export default function PricingTiers() {
  const [yearly, setYearly] = useState(false);
  const id = useId();
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <h2 className="text-center font-heading text-3xl font-black @3xl:text-5xl">
          ราคาตรงไปตรงมา
        </h2>
        <div
          role="radiogroup"
          aria-label="รอบบิล"
          className="mx-auto mt-6 flex w-fit rounded-lg border border-border bg-muted p-1"
        >
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              role="radio"
              aria-checked={yearly === y}
              onClick={() => {
                setYearly(y);
              }}
              className="relative rounded-md px-4 py-1.5 text-sm font-semibold"
            >
              {yearly === y && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-md bg-background shadow"
                />
              )}
              <span className="relative">{y ? "รายปี (ลด 20%)" : "รายเดือน"}</span>
            </button>
          ))}
        </div>
        <ul className="mt-10 grid items-start gap-4 @3xl:grid-cols-3">
          {tiers.map((t) => {
            const price = yearly ? t.y : t.m;
            return (
              <li
                key={t.n}
                className={`relative rounded-xl border p-6 ${t.hot ? "border-primary bg-card shadow-xl @3xl:-translate-y-3" : "border-border bg-card"}`}
              >
                {t.hot && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    ยอดนิยม
                  </span>
                )}
                <h3 className="font-semibold">{t.n}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.d}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="text-lg">฿</span>
                  <span className="inline-block overflow-hidden">
                    <motion.span
                      key={price}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-block font-heading text-4xl font-black tabular-nums"
                    >
                      {price.toLocaleString("th-TH")}
                    </motion.span>
                  </span>
                  <span className="text-sm text-muted-foreground">/เดือน</span>
                </p>
                <a
                  href="#buy"
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center font-semibold ${t.hot ? "bg-primary text-primary-foreground" : "border border-border"}`}
                >
                  {t.m === 0 ? "เริ่มฟรี" : "เลือกแพ็กนี้"}
                </a>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.f.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
