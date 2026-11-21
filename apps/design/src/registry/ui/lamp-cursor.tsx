"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const grid =
  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)";

/**
 * A soft lamp trails the pointer a beat behind it. Where its light falls the grid and the heading
 * underneath come up bright; everything else stays in the dark.
 */
export default function LampCursor({
  radius = 180,
  lag = 0.12,
}: {
  radius?: number;
  lag?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let x = el.clientWidth / 2;
    let y = el.clientHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    const put = () => {
      el.style.setProperty("--x", `${String(x)}px`);
      el.style.setProperty("--y", `${String(y)}px`);
    };
    const tick = () => {
      x += (tx - x) * (still ? 1 : lag);
      y += (ty - y) * (still ? 1 : lag);
      put();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      raf ||= requestAnimationFrame(tick);
    };
    put();
    el.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
    };
  }, [lag, still]);

  const mask = `radial-gradient(circle ${String(radius)}px at var(--x) var(--y), black, transparent)`;
  return (
    <div
      ref={box}
      className="relative grid size-full min-h-72 place-items-center overflow-hidden bg-(--em-ink-975) p-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-size-[32px_32px] text-(--em-ink-900)"
        style={{ backgroundImage: grid }}
      />
      <p className="relative font-heading text-4xl font-black text-(--em-ink-700) sm:text-6xl">
        ส่องหาสิ่งที่ซ่อนอยู่
      </p>
      {/* the lit copy covers the whole box, so its mask uses the same coordinates as the pointer */}
      <div
        aria-hidden
        className="absolute inset-0 grid place-items-center bg-size-[32px_32px] p-6 text-(--em-blue-500)/60"
        style={{ backgroundImage: grid, maskImage: mask }}
      >
        <p className="font-heading text-4xl font-black text-(--em-ink-0) sm:text-6xl">
          ส่องหาสิ่งที่ซ่อนอยู่
        </p>
      </div>
    </div>
  );
}
