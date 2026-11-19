"use client";

import { Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type PointerEvent } from "react";

const SPOT = 260;
const spring = { stiffness: 300, damping: 28 };

/** Glass card: tilts toward the pointer, drifts to it like a magnet, a spotlight follows along the border. */
export function SpotlightCard({
  title = "ส่งงานไวขึ้น",
  tilt = 10,
  magnet = 12,
  spotlight = true,
}: {
  title?: string;
  tilt?: number;
  magnet?: number;
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  // spotlight position: transform only, so it never repaints a gradient
  const spotX = useMotionValue(-SPOT);
  const spotY = useMotionValue(-SPOT);

  function move(e: PointerEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotateX.set(-py * tilt * 2);
    rotateY.set(px * tilt * 2);
    x.set(px * magnet * 2);
    y.set(py * magnet * 2);
    spotX.set(e.clientX - r.left - SPOT / 2);
    spotY.set(e.clientY - r.top - SPOT / 2);
  }

  function leave() {
    for (const v of [rotateX, rotateY, x, y]) v.set(0);
    spotX.set(-SPOT);
    spotY.set(-SPOT);
  }

  const spot = (opacity: string) =>
    spotlight && (
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 rounded-full bg-(--em-sky-400) blur-3xl ${opacity}`}
        style={{ width: SPOT, height: SPOT, x: spotX, y: spotY }}
      />
    );

  return (
    // the padding is the magnet's reach: the card starts to drift before the pointer is on it
    <div
      className="flex size-full min-h-72 items-center justify-center bg-(--em-ink-975) p-10 [perspective:900px]"
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <motion.div
        ref={ref}
        className="relative w-full max-w-xs overflow-hidden rounded-xl bg-(--em-ink-800) p-px [transform-style:preserve-3d]"
        style={{ rotateX, rotateY, x, y }}
      >
        {spot("opacity-90")}
        <div className="relative overflow-hidden rounded-[0.7rem] bg-(--em-ink-950) p-6">
          {spot("opacity-25")}
          <div className="relative">
            <span className="mb-8 flex size-10 items-center justify-center rounded-lg border border-(--em-ink-800) bg-(--em-ink-900)">
              <Sparkles aria-hidden className="size-5 text-(--em-sky-400)" />
            </span>
            <p className="font-mono text-[11px] tracking-[0.2em] text-(--em-ink-400) uppercase">
              Component
            </p>
            <h3 className="mt-1 font-heading text-xl font-black text-(--em-ink-50)">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--em-ink-400)">
              ขยับเมาส์ใกล้ๆ การ์ดจะเอียงตาม ขยับเข้าหา และไฟส่องจะวิ่งตามขอบ
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
