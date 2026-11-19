"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

const items = [
  "ปุ่ม",
  "การ์ด",
  "พื้นหลัง",
  "ตัวอักษร",
  "เมนู",
  "ฟอร์ม",
  "แจ้งเตือน",
  "กราฟ",
  "สื่อ",
  "เลย์เอาต์",
];

/** A horizontal row that snaps per card, fades at its edges and gets arrow buttons that hide at the ends. */
export default function SnapRow() {
  const row = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const step = (dir: number) => {
    const el = row.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const btn =
    "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-(--em-ink-700) bg-(--em-ink-900) text-(--em-ink-50) transition-opacity disabled:pointer-events-none disabled:opacity-0";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="relative w-full max-w-md">
        <button
          type="button"
          aria-label="เลื่อนซ้าย"
          disabled={edge.start}
          onClick={() => {
            step(-1);
          }}
          className={`${btn} -left-3`}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <ul
          ref={row}
          onScroll={(e) => {
            const el = e.currentTarget;
            setEdge({
              start: el.scrollLeft < 4,
              end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4,
            });
          }}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 py-2 [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] [scrollbar-width:none]"
        >
          {items.map((t, i) => (
            <li
              key={t}
              className="flex h-28 w-32 shrink-0 snap-start flex-col justify-between rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) p-3"
            >
              <span className="font-mono text-xs text-(--em-sky-400)">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold text-(--em-ink-50)">{t}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-label="เลื่อนขวา"
          disabled={edge.end}
          onClick={() => {
            step(1);
          }}
          className={`${btn} -right-3`}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
