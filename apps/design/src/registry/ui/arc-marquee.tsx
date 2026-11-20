"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useId, useRef } from "react";

/**
 * A ribbon of text runs along a bent line without end. Two copies sit on an SVG path and the start
 * offset slides by one copy's length, so the seam never shows. Drag to push it.
 */
export default function ArcMarquee({
  text = "crocwork design ✦ ",
  speed = 60,
  curve = 60,
}: {
  text?: string;
  speed?: number;
  curve?: number;
}) {
  const id = useId().replace(/:/g, "");
  const tp = useRef<SVGTextPathElement>(null);
  const still = useReducedMotionAfterMount();
  const push = useRef(0);
  // enough copies to cover the path whatever the text length
  const copies = Math.max(4, Math.ceil(80 / Math.max(text.length, 1)));

  useEffect(() => {
    const el = tp.current;
    if (!el || still) return;
    let off = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      const len = (el.getComputedTextLength() || 1) / copies;
      off -= (speed + push.current) * dt;
      push.current *= 0.92;
      off = ((off % len) - len) % len; // keep in (-len, 0]
      el.setAttribute("startOffset", String(off));
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [speed, still, copies]);

  return (
    <div
      className="grid size-full min-h-56 touch-pan-y place-items-center overflow-hidden bg-(--em-ink-975)"
      onPointerMove={(e) => {
        if (e.buttons) push.current = -e.movementX * 30;
      }}
    >
      <svg
        viewBox="0 0 1000 300"
        role="img"
        aria-label={text}
        className="w-full font-heading font-black"
      >
        <path
          id={id}
          d={`M -100 ${String(150 - curve)} Q 500 ${String(150 + curve * 2)} 1100 ${String(150 - curve)}`}
          fill="none"
        />
        <text fontSize="64" className="fill-(--em-ink-50)">
          <textPath ref={tp} href={`#${id}`}>
            {text.repeat(copies)}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
