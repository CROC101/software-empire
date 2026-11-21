"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

/**
 * Two hairlines cross at the pointer and follow it a touch behind, with the position read out in
 * small mono type beside the crossing, like a drafting table.
 */
export default function SightLines({
  lag = 0.2,
  readout = true,
}: {
  lag?: number;
  readout?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLSpanElement>(null);
  const v = useRef<HTMLSpanElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
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
      if (h.current) h.current.style.transform = `translateY(${String(y)}px)`;
      if (v.current) v.current.style.transform = `translateX(${String(x)}px)`;
      if (tag.current) {
        tag.current.style.transform = `translate(${String(x + 10)}px, ${String(y + 10)}px)`;
        tag.current.textContent = `x ${String(Math.round(x))}  y ${String(Math.round(y))}`;
      }
    };
    const tick = () => {
      x += (tx - x) * (still ? 1 : lag);
      y += (ty - y) * (still ? 1 : lag);
      put();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
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
  }, [lag, still, readout]);

  return (
    <div
      ref={box}
      className="relative size-full min-h-72 overflow-hidden bg-(--em-ink-975) bg-[radial-gradient(var(--em-ink-800)_1px,transparent_1px)] bg-size-[24px_24px] [@media(pointer:fine)]:cursor-none"
    >
      <span
        ref={h}
        aria-hidden
        className="vt-live absolute inset-x-0 top-0 h-px bg-(--em-sky-400)/70"
      />
      <span
        ref={v}
        aria-hidden
        className="vt-live absolute inset-y-0 left-0 w-px bg-(--em-sky-400)/70"
      />
      {readout && (
        <span
          ref={tag}
          aria-hidden
          className="vt-live absolute top-0 left-0 font-mono text-[11px] whitespace-pre text-(--em-sky-400)"
        />
      )}
    </div>
  );
}
