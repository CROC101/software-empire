"use client";

import { ChevronDown, Code2, LayoutGrid, LifeBuoy, Newspaper, Palette, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const menus = [
  {
    label: "บริการ",
    items: [
      { t: "ออกแบบเว็บ", s: "ระบบดีไซน์และหน้าจอหลัก", i: Palette },
      { t: "พัฒนาเว็บ", s: "Next.js, Supabase, Cloudflare", i: Code2 },
      { t: "เปิดตัวสินค้า", s: "หน้าขายและแคมเปญ", i: Rocket },
    ],
  },
  {
    label: "แหล่งข้อมูล",
    items: [
      { t: "คลังชิ้นส่วน", s: "ก็อปไปใช้ได้ทันที", i: LayoutGrid },
      { t: "บทความ", s: "เบื้องหลังการทำงาน", i: Newspaper },
      { t: "ช่วยเหลือ", s: "คำถามที่พบบ่อย", i: LifeBuoy },
    ],
  },
];

/** A header whose top items open a wide panel of grouped links on hover, click or keyboard; Esc closes it. */
export default function HeaderMega() {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const away = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", away);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", away);
    };
  }, [open]);
  const cur = open === null ? undefined : menus[open];
  return (
    <div className="min-h-96 bg-background text-foreground @container">
      <header
        ref={bar}
        onPointerLeave={() => {
          setOpen(null);
        }}
        className="relative border-b border-border bg-background"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <a href="#top" className="font-heading text-lg font-black">
            crocwork
          </a>
          <nav aria-label="หลัก">
            <ul className="flex gap-1">
              {menus.map((m, i) => (
                <li key={m.label}>
                  <button
                    type="button"
                    aria-expanded={open === i}
                    aria-controls={`${id}-panel`}
                    onPointerEnter={() => {
                      setOpen(i);
                    }}
                    onClick={() => {
                      setOpen(open === i ? null : i);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  >
                    {m.label}
                    <ChevronDown
                      aria-hidden
                      className={`size-3.5 transition-transform ${open === i ? "rotate-180" : ""}`}
                    />
                  </button>
                </li>
              ))}
              <li>
                <a href="#price" className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                  ราคา
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <AnimatePresence>
          {cur && (
            <motion.div
              id={`${id}-panel`}
              key={cur.label}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-x-0 top-full z-10 border-b border-border bg-popover text-popover-foreground shadow-xl"
            >
              <ul className="mx-auto grid max-w-6xl gap-2 p-5 @2xl:grid-cols-3">
                {cur.items.map(({ t, s, i: Icon }) => (
                  <li key={t}>
                    <a href={`#${t}`} className="flex gap-3 rounded-lg p-3 hover:bg-muted">
                      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <span>
                        <span className="block font-semibold">{t}</span>
                        <span className="text-sm text-muted-foreground">{s}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <p className="px-6 py-16 text-center text-muted-foreground">ชี้หรือกดที่เมนูด้านบน</p>
    </div>
  );
}
