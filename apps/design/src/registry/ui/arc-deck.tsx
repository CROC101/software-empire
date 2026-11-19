"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const cards = [
  {
    name: "ทะเลสาบยามเช้า",
    tags: ["ภูมิทัศน์", "เช้า"],
    sky: "from-(--em-blue-700) to-(--em-sky-400)",
  },
  {
    name: "ท่าเรือกลางคืน",
    tags: ["เมือง", "กลางคืน"],
    sky: "from-(--em-ink-950) to-(--em-blue-700)",
  },
  { name: "หมอกบนเขา", tags: ["ภูเขา"], sky: "from-(--em-ink-700) to-(--em-ink-300)" },
  { name: "น้ำขึ้น", tags: ["ทะเล", "บ่าย"], sky: "from-(--em-blue-900) to-(--em-blue-500)" },
  { name: "ฝนแรก", tags: ["ฤดูฝน"], sky: "from-(--em-ink-900) to-(--em-ink-500)" },
  {
    name: "เรือลำสุดท้าย",
    tags: ["แม่น้ำ", "เย็น"],
    sky: "from-(--em-blue-800) to-(--em-sky-500)",
  },
  { name: "ดวงจันทร์เต็มดวง", tags: ["กลางคืน"], sky: "from-(--em-ink-975) to-(--em-ink-800)" },
];

/**
 * Cards fanned on an arc. Drag sideways, use the arrows or the arrow keys to step; it plays on its
 * own until you point at it or focus it. The centre card's name and tags read out below.
 */
export default function ArcDeck({
  autoplay = true,
  seconds = 3,
}: {
  autoplay?: boolean;
  seconds?: number;
}) {
  const still = useReducedMotionAfterMount();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = cards.length;
  const step = (d: number) => {
    setActive((a) => (a + d + n) % n);
  };

  useEffect(() => {
    if (!autoplay || paused || still) return;
    const t = setInterval(() => {
      setActive((a) => (a + 1) % n);
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [autoplay, paused, still, seconds, n]);

  const cur = cards[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="แกลเลอรี"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="@container relative grid size-full min-h-[30rem] place-items-center overflow-clip bg-(--em-ink-975) py-10 text-(--em-ink-50) outline-none focus-visible:ring-2 focus-visible:ring-(--em-blue-500) focus-visible:ring-inset"
    >
      <motion.div
        drag={still ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 40) step(info.offset.x < 0 ? 1 : -1);
        }}
        className="relative h-64 w-full cursor-grab touch-pan-y active:cursor-grabbing @lg:h-80"
      >
        {cards.map((c, i) => {
          let d = i - active;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          const far = Math.abs(d) > 2;
          return (
            <motion.div
              key={c.name}
              aria-hidden={d !== 0}
              initial={false}
              animate={{
                x: `${String(d * 62)}%`,
                y: d * d * 14,
                rotate: d * 9,
                scale: 1 - Math.abs(d) * 0.08,
                opacity: far ? 0 : 1 - Math.abs(d) * 0.22,
              }}
              transition={still ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 30 }}
              style={{ zIndex: 10 - Math.abs(d) }}
              className={`absolute top-0 left-1/2 -ml-20 h-56 w-40 origin-bottom overflow-clip rounded-xl border border-(--em-ink-800) bg-linear-to-b ${c.sky} @lg:-ml-28 @lg:h-72 @lg:w-56`}
            >
              <span className="absolute top-5 right-5 size-8 rounded-full bg-(--em-ink-50)/90" />
              <span className="absolute inset-x-0 bottom-0 h-1/3 bg-(--em-ink-975)/60 [clip-path:polygon(0_100%,0_40%,30%_5%,55%_50%,80%_15%,100%_45%,100%_100%)]" />
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          aria-label="ก่อนหน้า"
          onClick={() => {
            step(-1);
          }}
          className="grid size-10 place-items-center rounded-md border border-(--em-ink-800) hover:bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-blue-500)"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <div aria-live="polite" className="w-48 text-center">
          <p className="font-semibold">{cur?.name}</p>
          <p className="mt-1 text-xs text-(--em-ink-400)">{cur?.tags.join(" · ")}</p>
        </div>
        <button
          type="button"
          aria-label="ถัดไป"
          onClick={() => {
            step(1);
          }}
          className="grid size-10 place-items-center rounded-md border border-(--em-ink-800) hover:bg-(--em-ink-900) focus-visible:outline-2 focus-visible:outline-(--em-blue-500)"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </section>
  );
}
