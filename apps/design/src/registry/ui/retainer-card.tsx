"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { Check } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";

const features = [
  "งานออกแบบและโค้ดไม่จำกัดคำขอ ทำทีละงาน",
  "ส่งงานชิ้นแรกภายใน 3 วันทำการ",
  "คุยผ่านห้องแชตส่วนตัว ตอบในวันทำการ",
  "หยุดหรือยกเลิกได้ทุกเดือน",
];

/**
 * A freelancer's offer: a profile card that leans toward the pointer (rotate only, springy) beside a
 * monthly retainer price with what it includes. Reduced motion keeps the card flat.
 */
export default function RetainerCard({
  price = 45000,
  available = true,
}: {
  price?: number;
  available?: boolean;
}) {
  const still = useReducedMotionAfterMount();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 180, damping: 18 });

  return (
    <section className="@container bg-background px-4 py-16 text-foreground @lg:px-8">
      <div className="mx-auto grid max-w-4xl items-center gap-6 @2xl:grid-cols-2">
        <div className="[perspective:900px]">
          <motion.div
            style={still ? undefined : { rotateX, rotateY }}
            onPointerMove={(e) => {
              if (still) return;
              const r = e.currentTarget.getBoundingClientRect();
              ry.set(((e.clientX - r.left) / r.width - 0.5) * 14);
              rx.set(-((e.clientY - r.top) / r.height - 0.5) * 14);
            }}
            onPointerLeave={() => {
              rx.set(0);
              ry.set(0);
            }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div
              aria-hidden
              className="relative h-36 overflow-clip rounded-lg bg-linear-to-b from-(--em-blue-800) to-(--em-sky-400)"
            >
              <span className="absolute bottom-0 left-1/2 grid size-20 -translate-x-1/2 translate-y-1/3 place-items-center rounded-full border-4 border-card bg-(--em-ink-800) font-heading text-xl font-black text-(--em-ink-50)">
                ณช
              </span>
            </div>
            <p className="mt-10 text-center font-heading text-2xl font-black">ณัฐชา ริมธาร</p>
            <p className="text-center text-sm text-muted-foreground">นักออกแบบและนักพัฒนาเว็บ</p>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm">
              <span
                className={`size-2 rounded-full ${available ? "bg-(--em-sky-500)" : "bg-(--em-ink-400)"}`}
              />
              {available ? "ว่างรับงานเดือนนี้" : "คิวเต็ม เปิดรับเดือนหน้า"}
            </p>
            <dl className="mt-6 grid grid-cols-3 border-t border-border pt-4 text-center">
              {[
                ["ปี", "8"],
                ["ลูกค้า", "36"],
                ["รีวิว", "4.9"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dd className="font-heading text-xl font-black tabular-nums">{v}</dd>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 p-6 @lg:p-8">
          <p className="text-sm text-muted-foreground">จ้างรายเดือน</p>
          <p className="mt-2 font-heading text-4xl font-black tabular-nums">
            ฿{price.toLocaleString("th-TH")}
            <span className="text-base font-normal text-muted-foreground"> / เดือน</span>
          </p>
          <ul className="mt-6 grid gap-3">
            {features.map((f) => (
              <li key={f} className="flex gap-3 text-sm">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#contact"
            aria-disabled={!available}
            className="mt-8 block rounded-lg bg-primary px-5 py-3 text-center font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {available ? "นัดคุย 20 นาที" : "จองคิวเดือนหน้า"}
          </a>
        </div>
      </div>
    </section>
  );
}
