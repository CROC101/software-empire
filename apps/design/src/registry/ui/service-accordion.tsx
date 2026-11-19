"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useId, useState } from "react";

const services = [
  {
    name: "ออกแบบเว็บไซต์",
    time: "3–5 สัปดาห์",
    tools: ["Figma", "Next.js", "Tailwind"],
    text: "เริ่มจากคุยว่าลูกค้าของคุณมองหาอะไร แล้วออกแบบหน้าที่ตอบตรงนั้นก่อนเรื่องอื่น",
    sky: "from-(--em-blue-800) to-(--em-sky-400)",
  },
  {
    name: "แอปมือถือ",
    time: "6–10 สัปดาห์",
    tools: ["React Native", "Supabase"],
    text: "แอปเดียวลงทั้ง iOS และ Android พร้อมระบบล็อกอินและแจ้งเตือน",
    sky: "from-(--em-ink-900) to-(--em-blue-600)",
  },
  {
    name: "ระบบหลังบ้าน",
    time: "4–8 สัปดาห์",
    tools: ["Postgres", "RLS", "Edge Functions"],
    text: "ตารางข้อมูลที่ปลอดภัยตั้งแต่วันแรก ทุกตารางมีสิทธิ์ของมันเองและมีเทสต์คุม",
    sky: "from-(--em-blue-900) to-(--em-blue-500)",
  },
  {
    name: "ดูแลรายเดือน",
    time: "ต่อเนื่อง",
    tools: ["Monitoring", "Backups"],
    text: "อัปเดตแพ็กเกจ เฝ้าระบบ และแก้ปัญหาก่อนลูกค้าคุณจะเห็น",
    sky: "from-(--em-ink-950) to-(--em-ink-600)",
  },
];

/**
 * A numbered list of services that open one at a time. On a mouse, a small picture of the row you
 * point at follows the cursor (transform only, springy); touch screens never show it.
 */
export default function ServiceAccordion({ preview = true }: { preview?: boolean }) {
  const still = useReducedMotionAfterMount();
  const [open, setOpen] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 28 });
  const y = useSpring(my, { stiffness: 260, damping: 28 });

  return (
    <section
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left + 24);
        my.set(e.clientY - r.top - 60);
      }}
      onPointerLeave={() => {
        setHover(null);
      }}
      className="@container relative bg-background px-4 py-16 text-foreground @lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="font-heading text-3xl font-black @lg:text-4xl">สิ่งที่เราทำ</h2>
        <ul className="mt-8 border-t border-border">
          {services.map((s, i) => {
            const on = open === i;
            return (
              <li
                key={s.name}
                onPointerEnter={() => {
                  setHover(i);
                }}
                className="border-b border-border"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`${id}-${String(i)}`}
                    onClick={() => {
                      setOpen(on ? -1 : i);
                    }}
                    className="flex w-full items-baseline gap-4 py-5 text-left outline-none focus-visible:text-primary"
                  >
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-heading text-2xl font-black @lg:text-3xl">
                      {s.name}
                    </span>
                    {on ? (
                      <Minus aria-hidden className="size-5 shrink-0 self-center" />
                    ) : (
                      <Plus aria-hidden className="size-5 shrink-0 self-center" />
                    )}
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`${id}-${String(i)}`}
                      role="region"
                      initial={still ? false : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        still ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }
                      }
                      className="grid gap-4 pb-6 pl-9 @xl:grid-cols-[1fr_auto]"
                    >
                      <p className="max-w-lg text-muted-foreground">{s.text}</p>
                      <div className="flex flex-col gap-2 @xl:items-end">
                        <p className="text-sm">
                          <span className="text-muted-foreground">ระยะเวลา </span>
                          {s.time}
                        </p>
                        <ul className="flex flex-wrap gap-1.5">
                          {s.tools.map((t) => (
                            <li
                              key={t}
                              className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                            >
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      {preview && !still && (
        <motion.div
          aria-hidden
          style={{ x, y }}
          animate={{ opacity: hover === null ? 0 : 1, scale: hover === null ? 0.8 : 1 }}
          className="pointer-events-none absolute top-0 left-0 hidden h-28 w-40 overflow-clip rounded-lg border border-border pointer-fine:block"
        >
          {services.map((s, i) => (
            <span
              key={s.name}
              className={`absolute inset-0 bg-linear-to-b ${s.sky} transition-opacity duration-300 ${hover === i ? "opacity-100" : "opacity-0"}`}
            >
              <span className="absolute top-3 right-4 size-5 rounded-full bg-(--em-ink-50)" />
              <span className="absolute inset-x-0 bottom-0 h-10 bg-(--em-ink-975)/60 [clip-path:polygon(0_100%,0_50%,30%_10%,55%_60%,80%_20%,100%_55%,100%_100%)]" />
            </span>
          ))}
        </motion.div>
      )}
    </section>
  );
}
