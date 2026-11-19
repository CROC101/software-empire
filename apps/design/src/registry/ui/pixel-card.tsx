"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Seeded order, so server and client agree on every delay. */
function delays(count: number): number[] {
  let seed = 7;
  return Array.from({ length: count }, () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  });
}

/** Two faces; a grid of pixels covers one cell at a time, the face swaps, the pixels clear. */
export function PixelCard({
  grid = 9,
  duration = 450,
  tone = "blue",
}: {
  grid?: number;
  duration?: number;
  tone?: "blue" | "sky" | "violet" | "teal";
}) {
  const [covering, setCovering] = useState(false);
  const [second, setSecond] = useState(false);
  const target = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const order = useMemo(() => delays(grid * grid), [grid]);
  const half = duration / 2;

  const go = (next: boolean) => {
    if (target.current === next) return;
    target.current = next;
    clearTimeout(timer.current);
    setCovering(true);
    timer.current = setTimeout(() => {
      setSecond(next);
      setCovering(false);
    }, half);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const color = {
    blue: "--em-blue-500",
    sky: "--em-sky-400",
    violet: "--em-violet-500",
    teal: "--em-teal-400",
  }[tone];

  return (
    <div className="flex size-full min-h-72 items-center justify-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        aria-pressed={second}
        aria-label="สลับหน้าการ์ด"
        onPointerEnter={(e) => e.pointerType === "mouse" && go(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && go(false)}
        onClick={() => go(!target.current)}
        className="relative size-56 overflow-hidden rounded-xl border border-(--em-ink-800) outline-offset-4 focus-visible:outline-2 focus-visible:outline-(--em-blue-400)"
      >
        {second ? (
          <span className="flex size-full flex-col items-center justify-center gap-1 bg-linear-to-br from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700) text-(--em-ink-0)">
            <span className="font-heading text-3xl font-black">สวัสดี</span>
            <span className="text-sm opacity-80">หน้าที่สอง</span>
          </span>
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2 bg-(--em-ink-950) text-(--em-ink-50)">
            <span aria-hidden className="text-5xl text-(--em-sky-400)">
              ✦
            </span>
            <span className="text-sm text-(--em-ink-400)">ชี้หรือแตะการ์ด</span>
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${grid}, 1fr)`,
            gridTemplateRows: `repeat(${grid}, 1fr)`,
          }}
        >
          {order.map((d, i) => (
            <span
              key={i}
              style={{
                backgroundColor: `var(${color})`,
                opacity: covering ? 1 : 0,
                transition: `opacity 0s linear ${(d * half) / 1000}s`,
              }}
            />
          ))}
        </span>
      </button>
    </div>
  );
}

export default PixelCard;
