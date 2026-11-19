"use client";

import { motion } from "motion/react";

/** A bento of differently sized boxes, each holding a small live mockup (chart, chat, toggle, ring). */
export default function FeaturesBento() {
  return (
    <section className="bg-background text-foreground @container">
      <style>{`@keyframes features-bento-bar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}@keyframes features-bento-in{0%,20%{opacity:0;transform:translateY(8px)}35%,90%{opacity:1;transform:none}100%{opacity:0}}@keyframes features-bento-knob{0%,45%{transform:translateX(0)}55%,100%{transform:translateX(20px)}}.features-bento-bar{transform-origin:bottom;animation:features-bento-bar 2.4s ease-in-out infinite}.features-bento-msg{animation:features-bento-in 5s ease-out infinite}.features-bento-knob{animation:features-bento-knob 3s ease-in-out infinite alternate}@media (prefers-reduced-motion:reduce){.features-bento-bar,.features-bento-msg,.features-bento-knob{animation:none}}`}</style>
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">why us</p>
        <h2 className="mt-3 font-heading text-3xl font-black @3xl:text-5xl">
          ดูของจริง ไม่ใช่แค่คำโฆษณา
        </h2>
        <div className="mt-10 grid auto-rows-[13rem] gap-4 @3xl:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 @3xl:col-span-2"
          >
            <div className="flex h-24 items-end gap-2">
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  key={i}
                  className="features-bento-bar vt-live flex-1 rounded-t bg-primary"
                  style={{
                    animationDelay: `${String(i * 0.12)}s`,
                    height: `${String(40 + ((i * 37) % 60))}%`,
                  }}
                />
              ))}
            </div>
            <div>
              <h3 className="font-semibold">รายงานสด</h3>
              <p className="text-sm text-muted-foreground">ยอดขายและผู้ใช้ขยับให้เห็นทันที</p>
            </div>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 @3xl:row-span-2"
          >
            <ul className="space-y-2 text-sm">
              {["ส่งไฟล์แล้วนะ", "ขอบคุณครับ ตรวจให้เลย", "ผ่านแล้ว ขึ้นระบบได้"].map((m, i) => (
                <li
                  key={m}
                  className={`features-bento-msg vt-live w-fit max-w-[85%] rounded-lg px-3 py-2 ${i % 2 ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
                  style={{ animationDelay: `${String(i * 0.6)}s` }}
                >
                  {m}
                </li>
              ))}
            </ul>
            <div>
              <h3 className="font-semibold">แชทในงาน</h3>
              <p className="text-sm text-muted-foreground">คุยกับลูกค้าในหน้างานเดียวกัน</p>
            </div>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6"
          >
            <span aria-hidden className="relative h-6 w-11 rounded-full bg-primary">
              <span className="features-bento-knob vt-live absolute top-0.5 left-0.5 size-5 rounded-full bg-background" />
            </span>
            <div>
              <h3 className="font-semibold">ธีมมืดสว่าง</h3>
              <p className="text-sm text-muted-foreground">สลับได้ทั้งเว็บ</p>
            </div>
          </motion.article>
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            className="flex flex-col justify-between rounded-xl border border-border bg-linear-to-br from-(--em-blue-600) to-(--em-blue-900) p-6 text-(--em-ink-0)"
          >
            <p className="font-heading text-5xl font-black">99.9%</p>
            <div>
              <h3 className="font-semibold">ออนไลน์ตลอด</h3>
              <p className="text-sm text-(--em-ink-200)">โฮสต์บน edge ทั่วโลก</p>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
