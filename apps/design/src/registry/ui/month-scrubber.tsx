"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

const months = [
  { m: "ม.ค.", sky: "from-(--em-ink-900) to-(--em-blue-700)", note: "หนาว ฟ้าใส" },
  { m: "ก.พ.", sky: "from-(--em-blue-800) to-(--em-blue-500)", note: "ลมเย็นปลายหนาว" },
  { m: "มี.ค.", sky: "from-(--em-blue-700) to-(--em-sky-400)", note: "แดดเริ่มแรง" },
  { m: "เม.ย.", sky: "from-(--em-blue-600) to-(--em-sky-400)", note: "ร้อนที่สุดของปี" },
  { m: "พ.ค.", sky: "from-(--em-blue-700) to-(--em-sky-500)", note: "ฝนแรก" },
  { m: "มิ.ย.", sky: "from-(--em-ink-700) to-(--em-blue-500)", note: "เมฆครึ้มบ่าย ๆ" },
  { m: "ก.ค.", sky: "from-(--em-ink-800) to-(--em-ink-500)", note: "ฝนตกทุกเย็น" },
  { m: "ส.ค.", sky: "from-(--em-ink-850) to-(--em-blue-600)", note: "น้ำในคลองเต็ม" },
  { m: "ก.ย.", sky: "from-(--em-ink-900) to-(--em-ink-600)", note: "ฝนหนักสุด" },
  { m: "ต.ค.", sky: "from-(--em-blue-900) to-(--em-blue-500)", note: "ปลายฝน ฟ้าเปิด" },
  { m: "พ.ย.", sky: "from-(--em-blue-900) to-(--em-sky-500)", note: "ลอยกระทง ลมหนาวมา" },
  { m: "ธ.ค.", sky: "from-(--em-ink-975) to-(--em-blue-800)", note: "หนาว คืนยาว" },
];

function Reel({ d }: { d: number }) {
  const still = useReducedMotionAfterMount();
  return (
    <span className="relative inline-block h-[1em] overflow-clip leading-none">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${String(-d * 10)}%` }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 22 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="h-[1em]">
            {i}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Drag along a month ruler (or use the arrow, Home and End keys) and the scene above slides in from
 * the side you moved toward, while the month number rolls on digit reels.
 */
export default function MonthScrubber({ start = 11 }: { start?: number }) {
  const still = useReducedMotionAfterMount();
  const [v, setV] = useState(Math.min(12, Math.max(1, start)) - 1);
  const [dir, setDir] = useState(1);
  const track = useRef<HTMLDivElement>(null);
  const set = (next: number) => {
    const c = Math.min(11, Math.max(0, next));
    setV((cur) => {
      if (c !== cur) setDir(c > cur ? 1 : -1);
      return c;
    });
  };
  const fromX = (x: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    set(Math.round(((x - r.left) / r.width) * 11));
  };
  const cur = months[v] ?? { m: "", sky: "", note: "" };
  const num = String(v + 1).padStart(2, "0");

  return (
    <div className="@container flex size-full min-h-[30rem] flex-col justify-center gap-6 overflow-clip bg-(--em-ink-975) p-6 text-(--em-ink-50) @lg:p-10">
      <div className="relative aspect-[16/9] w-full overflow-clip rounded-xl border border-(--em-ink-800) @3xl:aspect-[21/9]">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={v}
            aria-hidden
            initial={still ? false : { x: `${String(dir * 100)}%` }}
            animate={{ x: 0 }}
            exit={
              still
                ? { opacity: 0, transition: { duration: 0 } }
                : { x: `${String(dir * -30)}%`, opacity: 0.4 }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-linear-to-b ${cur.sky}`}
          >
            <span className="absolute top-[14%] right-[12%] size-[10%] rounded-full bg-(--em-ink-50)/90" />
            <span className="absolute inset-x-0 bottom-0 h-2/5 bg-(--em-ink-975)/60 [clip-path:polygon(0_100%,0_45%,20%_15%,40%_50%,62%_8%,82%_45%,100%_20%,100%_100%)]" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-4 rounded-lg bg-(--em-ink-975)/50 px-4 py-2 backdrop-blur-md">
          <p className="font-heading text-3xl font-black tabular-nums">
            <Reel d={Number(num[0])} />
            <Reel d={Number(num[1])} />
          </p>
          <p className="text-sm text-(--em-ink-200)">{cur.note}</p>
        </div>
      </div>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="เดือน"
        aria-valuemin={1}
        aria-valuemax={12}
        aria-valuenow={v + 1}
        aria-valuetext={`${cur.m} ${cur.note}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromX(e.clientX);
        }}
        onKeyDown={(e) => {
          const k: Record<string, number> = {
            ArrowRight: v + 1,
            ArrowUp: v + 1,
            ArrowLeft: v - 1,
            ArrowDown: v - 1,
            Home: 0,
            End: 11,
          };
          const next = k[e.key];
          if (next === undefined) return;
          e.preventDefault();
          set(next);
        }}
        className="relative cursor-ew-resize touch-none rounded-md py-2 outline-none select-none focus-visible:ring-2 focus-visible:ring-(--em-blue-500)"
      >
        <div className="flex justify-between">
          {months.map((m, i) => (
            <span key={m.m} className="flex w-0 flex-col items-center gap-2">
              <span
                className={`w-px ${i === v ? "h-6 bg-(--em-sky-400)" : "h-3 bg-(--em-ink-600)"}`}
              />
              <span
                className={`text-[0.65rem] whitespace-nowrap ${i === v ? "text-(--em-ink-50)" : "text-(--em-ink-500)"} hidden @lg:block`}
              >
                {m.m}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-sm @lg:hidden">{cur.m}</p>
      </div>
    </div>
  );
}
