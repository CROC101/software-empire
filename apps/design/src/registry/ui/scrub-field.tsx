"use client";

import { useRef, useState } from "react";

const fields = [
  { key: "w", label: "กว้าง", start: 320, min: 0, max: 1920 },
  { key: "h", label: "สูง", start: 180, min: 0, max: 1080 },
  { key: "r", label: "มุม", start: 12, min: 0, max: 48 },
];

/** Number fields you change by dragging sideways across the label, the way design tools do. */
export default function ScrubField({ step = 1 }: { step?: number }) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.start])),
  );
  const from = useRef({ x: 0, v: 0 });
  const set = (key: string, n: number, min: number, max: number) => {
    setVals((all) => ({ ...all, [key]: Math.max(min, Math.min(max, Math.round(n))) }));
  };
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="flex flex-col gap-2">
        {fields.map((f) => {
          const v = vals[f.key] ?? f.start;
          return (
            <div
              key={f.key}
              role="spinbutton"
              tabIndex={0}
              aria-label={f.label}
              aria-valuemin={f.min}
              aria-valuemax={f.max}
              aria-valuenow={v}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                from.current = { x: e.clientX, v };
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                set(
                  f.key,
                  from.current.v + ((e.clientX - from.current.x) / 2) * step,
                  f.min,
                  f.max,
                );
              }}
              onKeyDown={(e) => {
                const d = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step }[
                  e.key
                ];
                if (!d) return;
                e.preventDefault();
                set(f.key, v + d * (e.shiftKey ? 10 : 1), f.min, f.max);
              }}
              className="flex w-48 cursor-ew-resize touch-none items-center justify-between rounded-md border border-(--em-ink-800) bg-(--em-ink-900) px-3 py-2 select-none hover:border-(--em-ink-600) focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <span className="text-sm text-(--em-ink-400)">{f.label}</span>
              <span className="font-mono text-sm text-(--em-ink-100) tabular-nums">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
