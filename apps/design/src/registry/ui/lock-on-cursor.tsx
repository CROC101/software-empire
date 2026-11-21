"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

/**
 * Four corner brackets follow the pointer and turn slowly while they wait. Over anything marked as
 * a target they stop turning and snap to its corners. Fine pointers only; touch keeps the cursor.
 */
export default function LockOnCursor({ size = 28, lag = 0.2 }: { size?: number; lag?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const reticle = useRef<HTMLDivElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = box.current;
    const ret = reticle.current;
    if (!el || !ret) return;
    // current and wanted frame: x, y, w, h, angle
    const cur = { x: 0, y: 0, w: size, h: size, a: 0 };
    const want = { ...cur };
    let px = -1;
    let py = -1;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const r = el.getBoundingClientRect();
      const hit = [...el.querySelectorAll<HTMLElement>("[data-target]")].find((n) => {
        const b = n.getBoundingClientRect();
        return (
          px >= b.left - r.left &&
          px <= b.right - r.left &&
          py >= b.top - r.top &&
          py <= b.bottom - r.top
        );
      });
      if (hit) {
        const b = hit.getBoundingClientRect();
        Object.assign(want, {
          x: b.left - r.left - 6,
          y: b.top - r.top - 6,
          w: b.width + 12,
          h: b.height + 12,
        });
        want.a = Math.round(cur.a / 90) * 90;
      } else {
        Object.assign(want, { x: px - size / 2, y: py - size / 2, w: size, h: size });
        if (!still) want.a = cur.a + 90 * dt;
      }
      const k = still ? 1 : lag;
      cur.x += (want.x - cur.x) * k;
      cur.y += (want.y - cur.y) * k;
      cur.w += (want.w - cur.w) * k;
      cur.h += (want.h - cur.h) * k;
      cur.a += (want.a - cur.a) * (hit ? k : 1);
      ret.style.transform = `translate(${String(cur.x)}px, ${String(cur.y)}px) rotate(${String(cur.a)}deg)`;
      ret.style.width = `${String(cur.w)}px`;
      ret.style.height = `${String(cur.h)}px`;
      raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      ret.style.opacity = "1";
      if (!raf) {
        cur.x = px - size / 2;
        cur.y = py - size / 2;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const leave = () => {
      ret.style.opacity = "0";
      cancelAnimationFrame(raf);
      raf = 0;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [size, lag, still]);

  const corner = "absolute size-2.5 border-(--em-sky-400)";
  return (
    <div
      ref={box}
      className="relative grid size-full min-h-72 place-content-center gap-4 overflow-hidden bg-(--em-ink-975) p-6 [@media(pointer:fine)]:cursor-none"
    >
      <p className="text-center text-sm text-(--em-ink-500)">เล็งไปที่ปุ่ม</p>
      <div className="flex flex-wrap justify-center gap-3">
        {["ดูผลงาน", "ราคา", "ติดต่อ"].map((w) => (
          <button
            key={w}
            type="button"
            data-target
            className="rounded-md border border-(--em-ink-800) bg-(--em-ink-900) px-4 py-2 text-sm text-(--em-ink-100) [@media(pointer:fine)]:cursor-none"
          >
            {w}
          </button>
        ))}
      </div>
      <div
        ref={reticle}
        aria-hidden
        className="vt-live pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity"
      >
        <span className={`${corner} top-0 left-0 border-t-2 border-l-2`} />
        <span className={`${corner} top-0 right-0 border-t-2 border-r-2`} />
        <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
        <span className={`${corner} right-0 bottom-0 border-r-2 border-b-2`} />
      </div>
    </div>
  );
}
