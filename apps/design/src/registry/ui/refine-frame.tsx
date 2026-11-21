"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const tiles = ["โลโก้", "ปก", "โปสเตอร์"];
const S = 88;
const GAP = 20;

/** Corner marks glide to the tile you pick, land loose, then tighten onto it. */
export default function RefineFrame({ padding = 24 }: { padding?: number }) {
  const [pick, setPick] = useState(0);
  const [loose, setLoose] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoose(false);
    }, 350);
    return () => {
      clearTimeout(t);
    };
  }, [pick]);
  const pad = loose ? padding : 4;
  const x0 = pick * (S + GAP);
  const corners = [
    { x: x0 - pad, y: -pad, c: "border-t-2 border-l-2" },
    { x: x0 + S + pad - 14, y: -pad, c: "border-t-2 border-r-2" },
    { x: x0 - pad, y: S + pad - 14, c: "border-b-2 border-l-2" },
    { x: x0 + S + pad - 14, y: S + pad - 14, c: "border-b-2 border-r-2" },
  ];
  return (
    <div className="grid size-full min-h-60 place-items-center bg-(--em-ink-975) p-6">
      <div
        className="relative flex"
        style={{ gap: GAP }}
        role="radiogroup"
        aria-label="เลือกชิ้นงาน"
      >
        {tiles.map((t, i) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={pick === i}
            onClick={() => {
              setLoose(true);
              setPick(i);
            }}
            className={`grid place-items-center rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-(--em-sky-400) ${pick === i ? "bg-(--em-ink-800) text-(--em-ink-0)" : "bg-(--em-ink-900) text-(--em-ink-400)"}`}
            style={{ width: S, height: S }}
          >
            {t}
          </button>
        ))}
        {corners.map((c) => (
          <motion.span
            key={c.c}
            aria-hidden
            className={`pointer-events-none absolute top-0 left-0 size-3.5 border-(--em-sky-400) ${c.c}`}
            animate={{ x: c.x, y: c.y }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          />
        ))}
      </div>
    </div>
  );
}
