"use client";

import { Archive, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const start = [
  { id: 1, who: "ร้านกาแฟริมน้ำ", text: "ขอแก้สีโลโก้อีกนิด" },
  { id: 2, who: "คลินิกฟันยิ้ม", text: "ส่งไฟล์เมนูแล้วนะ" },
  { id: 3, who: "โฮมสเตย์ปาย", text: "ราคานี้รวมโฮสต์ไหม" },
];

/** Rows you drag left to uncover archive and delete; let go halfway and the row settles open or shut. */
export default function SwipeRow() {
  const [rows, setRows] = useState(start);
  const [open, setOpen] = useState<number | null>(null);
  const drop = (id: number) => {
    setRows((r) => r.filter((x) => x.id !== id));
  };
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.li
                key={r.id}
                layout
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden rounded-lg bg-(--em-ink-800)"
              >
                <div className="absolute inset-y-0 right-0 flex w-24">
                  <button
                    type="button"
                    aria-label={`เก็บ ${r.who}`}
                    tabIndex={open === r.id ? 0 : -1}
                    onClick={() => {
                      drop(r.id);
                    }}
                    className="grid flex-1 place-items-center bg-(--em-blue-700) text-(--em-ink-0) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-sky-400)"
                  >
                    <Archive className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`ลบ ${r.who}`}
                    tabIndex={open === r.id ? 0 : -1}
                    onClick={() => {
                      drop(r.id);
                    }}
                    className="grid flex-1 place-items-center bg-(--em-danger) text-(--em-ink-0) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-sky-400)"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -96, right: 0 }}
                  dragElastic={0.1}
                  animate={{ x: open === r.id ? -96 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  onDragEnd={(_, info) => {
                    setOpen(info.offset.x < -48 ? r.id : null);
                  }}
                  tabIndex={0}
                  onFocus={() => {
                    setOpen(r.id);
                  }}
                  className="relative cursor-grab touch-pan-y bg-(--em-ink-900) px-4 py-3 outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-(--em-sky-400) focus-visible:ring-inset"
                >
                  <p className="text-sm font-semibold text-(--em-ink-100)">{r.who}</p>
                  <p className="text-xs text-(--em-ink-400)">{r.text}</p>
                </motion.div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {rows.length < start.length && (
          <button
            type="button"
            onClick={() => {
              setRows(start);
              setOpen(null);
            }}
            className="self-center rounded-md bg-(--em-ink-800) px-4 py-2 text-sm text-(--em-ink-100) hover:bg-(--em-ink-700) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
          >
            คืนข้อความ
          </button>
        )}
      </div>
    </div>
  );
}
