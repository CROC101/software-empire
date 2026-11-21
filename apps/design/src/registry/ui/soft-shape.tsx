"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const shapes = {
  วงกลม: <circle cx="50" cy="50" r="38" />,
  สี่เหลี่ยม: <rect x="14" y="14" width="72" height="72" rx="8" />,
  สามเหลี่ยม: <path d="M50 10 90 84H10Z" />,
} as const;

/**
 * An outline drawn out of focus. Where the pointer passes, a disc of sharp focus travels with it,
 * so the line comes clear under your hand and blurs again behind it.
 */
export default function SoftShape({
  shape = "วงกลม",
  radius = 90,
}: {
  shape?: keyof typeof shapes;
  radius?: number;
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
    const tick = () => {
      x += (tx - x) * (still ? 1 : 0.18);
      y += (ty - y) * (still ? 1 : 0.18);
      el.style.setProperty("--x", `${String(x)}px`);
      el.style.setProperty("--y", `${String(y)}px`);
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      raf ||= requestAnimationFrame(tick);
    };
    tick();
    el.addEventListener("pointermove", move);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
    };
  }, [still]);

  const svg = (cls: string) => (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={`absolute inset-0 m-auto size-[min(80%,18rem)] fill-none stroke-(--em-sky-400) ${cls}`}
      strokeWidth={2.5}
    >
      {shapes[shape]}
    </svg>
  );
  return (
    <div ref={box} className="relative size-full min-h-72 overflow-hidden bg-(--em-ink-975)">
      {svg("blur-md opacity-70")}
      <div
        className="absolute inset-0"
        style={{
          maskImage: `radial-gradient(circle ${String(radius)}px at var(--x) var(--y), black 40%, transparent)`,
        }}
      >
        {svg("")}
      </div>
    </div>
  );
}
