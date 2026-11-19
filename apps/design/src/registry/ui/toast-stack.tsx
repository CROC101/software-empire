"use client";

import { Bell, CheckCircle2, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Toast = { id: number; title: string; kind: "ok" | "info" | "bell" };

const samples: Omit<Toast, "id">[] = [
  { title: "บันทึกแล้ว", kind: "ok" },
  { title: "มีข้อความใหม่ 3 ข้อความ", kind: "bell" },
  { title: "อัปเดตพร้อมติดตั้ง", kind: "info" },
];
const icons = { ok: CheckCircle2, info: Info, bell: Bell };

/** Toasts pile up as a stack; point at the stack (or focus it) and it fans out into a list. */
export default function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>(() => samples.map((s, i) => ({ ...s, id: i })));
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState(samples.length);

  return (
    <div className="flex size-full min-h-80 flex-col items-center justify-between gap-6 bg-(--em-ink-975) p-6">
      <button
        type="button"
        onClick={() => {
          const s = samples[next % samples.length];
          if (!s) return;
          setToasts((t) => [{ ...s, id: next }, ...t].slice(0, 5));
          setNext((n) => n + 1);
        }}
        className="rounded-lg bg-(--em-blue-600) px-4 py-2 text-sm font-semibold text-(--em-ink-0)"
      >
        แจ้งเตือนใหม่
      </button>
      <ol
        aria-live="polite"
        onPointerEnter={() => {
          setOpen(true);
        }}
        onPointerLeave={() => {
          setOpen(false);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
        }}
        className="relative h-52 w-full max-w-xs"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t, i) => {
            const Icon = icons[t.kind];
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{
                  opacity: !open && i > 2 ? 0 : 1,
                  y: open ? -i * 62 : -i * 10,
                  scale: open ? 1 : 1 - i * 0.05,
                }}
                exit={{ opacity: 0, x: 80 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{ zIndex: 10 - i }}
                className="absolute inset-x-0 bottom-0 flex items-center gap-3 rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) px-4 py-3 shadow-xl"
              >
                <Icon aria-hidden className="size-5 shrink-0 text-(--em-sky-400)" />
                <span className="flex-1 text-sm text-(--em-ink-50)">{t.title}</span>
                <button
                  type="button"
                  aria-label="ปิดแจ้งเตือน"
                  onClick={() => {
                    setToasts((all) => all.filter((x) => x.id !== t.id));
                  }}
                  className="grid size-7 place-items-center rounded-md text-(--em-ink-400) hover:bg-(--em-ink-800)"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
