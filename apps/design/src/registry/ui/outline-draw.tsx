"use client";

import { useState, type CSSProperties } from "react";

/**
 * The pen traces every letter's outline, then ink floods in. SVG text with a dash that shrinks to
 * nothing; the filled copy above only fades.
 */
export default function OutlineDraw({
  text = "crocwork",
  duration = 2.5,
}: {
  text?: string;
  duration?: number;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="grid size-full min-h-56 place-items-center gap-2 bg-(--em-ink-975) p-6">
      <style>{`@keyframes outline-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes outline-fill{from{opacity:0}to{opacity:1}}.outline-draw-s{stroke-dasharray:1;animation:outline-draw var(--t) ease-in-out both}.outline-draw-f{animation:outline-fill .6s ease-out var(--t) both}@media (prefers-reduced-motion:reduce){.outline-draw-s,.outline-draw-f{animation:none}}`}</style>
      <svg
        key={run}
        viewBox="0 0 600 160"
        role="img"
        aria-label={text}
        className="w-full max-w-xl font-heading font-black"
        style={{ "--t": `${duration}s` } as CSSProperties}
      >
        <text
          x="300"
          y="115"
          textAnchor="middle"
          fontSize="120"
          pathLength={1}
          className="outline-draw-s fill-transparent stroke-(--em-blue-400) [stroke-width:2]"
        >
          {text}
        </text>
        <text
          x="300"
          y="115"
          textAnchor="middle"
          fontSize="120"
          className="outline-draw-f fill-(--em-ink-50)"
        >
          {text}
        </text>
      </svg>
      <button
        type="button"
        onClick={() => {
          setRun((r) => r + 1);
        }}
        className="rounded-md border border-(--em-ink-700) px-3 py-1.5 text-sm text-(--em-ink-300) transition-colors hover:text-(--em-ink-50)"
      >
        วาดอีกครั้ง
      </button>
    </div>
  );
}
