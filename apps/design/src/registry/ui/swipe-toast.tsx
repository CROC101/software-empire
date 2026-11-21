"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

const texts = [
  "บันทึกแล้ว",
  "ส่งไฟล์ให้ลูกค้าแล้ว",
  "มีคอมเมนต์ใหม่ 2 รายการ",
  "อัปโหลดเสร็จ",
  "ได้รับเงินมัดจำแล้ว",
];
type Toast = { id: number; text: string };
const make = (count: number): Toast[] =>
  Array.from({ length: count }, (_, i) => ({ id: i, text: texts[i % texts.length] ?? "" }));

/** Notices you flick sideways to dismiss; a short drag springs back. A close button does the same. */
export default function SwipeToast({ count = 3 }: { count?: number }) {
  const [toasts, setToasts] = useState(() => make(count));
  const [seen, setSeen] = useState(count);
  const [gone, setGone] = useState(1);
  const n = useRef(count);
  if (seen !== count) {
    setSeen(count);
    setToasts(make(count));
  }
  const drop = (id: number, dir = 1) => {
    setGone(dir);
    setToasts((t) => t.filter((x) => x.id !== id));
  };
  return (
    <div className="grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <div className="flex w-72 flex-col gap-3">
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <motion.li
                key={t.id}
                layout
                drag="x"
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 90) drop(t.id, Math.sign(info.offset.x));
                }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: gone * 320 }}
                className="flex cursor-grab touch-pan-y items-center justify-between gap-2 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) px-3 py-2.5 text-sm text-(--em-ink-100) active:cursor-grabbing"
              >
                {t.text}
                <button
                  type="button"
                  aria-label={`ปิด ${t.text}`}
                  onClick={() => {
                    drop(t.id);
                  }}
                  className="rounded p-1 text-(--em-ink-500) hover:text-(--em-ink-100) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
                >
                  <X className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <button
          type="button"
          onClick={() => {
            const id = n.current++;
            setToasts((t) => [...t, { id, text: texts[id % texts.length] ?? "" }]);
          }}
          className="self-center rounded-md bg-(--em-ink-800) px-4 py-2 text-sm text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
        >
          เพิ่มแจ้งเตือน
        </button>
      </div>
    </div>
  );
}
