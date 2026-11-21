"use client";

import { useRef, useState } from "react";

const R = 64;
const SWEEP = 270;
const START = 135;
const tail = [0.9, 0.6, 0.35, 0.15];

const at = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180;
  return { x: 80 + Math.cos(a) * r, y: 80 + Math.sin(a) * r };
};

/** A knob you turn by dragging round it; a bright head with a fading tail chases the value. */
export default function CometDial({ value = 40 }: { value?: number }) {
  const [v, setV] = useState(value);
  const [seen, setSeen] = useState(value);
  const box = useRef<SVGSVGElement>(null);
  if (seen !== value) {
    setSeen(value);
    setV(value);
  }
  const set = (n: number) => {
    setV(Math.max(0, Math.min(100, Math.round(n))));
  };
  const fromPointer = (cx: number, cy: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const deg =
      (Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * 180) / Math.PI;
    const rel = (deg - START + 360) % 360;
    if (rel <= SWEEP) set((rel / SWEEP) * 100);
  };
  const end = START + (v / 100) * SWEEP;
  const head = at(end);
  const arc = (from: number, to: number) => {
    const a = at(from);
    const b = at(to);
    return `M${String(a.x)} ${String(a.y)} A${String(R)} ${String(R)} 0 ${to - from > 180 ? "1" : "0"} 1 ${String(b.x)} ${String(b.y)}`;
  };
  return (
    <div className="grid size-full min-h-64 place-items-center bg-(--em-ink-975) p-6">
      <svg
        ref={box}
        viewBox="0 0 160 160"
        role="slider"
        tabIndex={0}
        aria-label="ความดัง"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          const d = {
            ArrowUp: 2,
            ArrowRight: 2,
            ArrowDown: -2,
            ArrowLeft: -2,
            PageUp: 10,
            PageDown: -10,
          }[e.key];
          if (d) {
            e.preventDefault();
            set(v + d);
          } else if (e.key === "Home") set(0);
          else if (e.key === "End") set(100);
        }}
        className="size-48 cursor-pointer touch-none rounded-full focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
      >
        <path
          d={arc(START, START + SWEEP)}
          fill="none"
          stroke="var(--em-ink-800)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {v > 0 && (
          <path
            d={arc(START, end)}
            fill="none"
            stroke="var(--em-blue-600)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        {tail.map((o, i) => {
          const p = at(Math.max(START, end - (i + 1) * 7));
          return (
            <circle key={o} cx={p.x} cy={p.y} r={5 - i} fill="var(--em-sky-400)" opacity={o} />
          );
        })}
        <circle cx={head.x} cy={head.y} r="7" fill="var(--em-ink-0)" />
        <text
          x="80"
          y="88"
          textAnchor="middle"
          className="fill-(--em-ink-0) text-2xl font-black tabular-nums"
        >
          {v}
        </text>
      </svg>
    </div>
  );
}
