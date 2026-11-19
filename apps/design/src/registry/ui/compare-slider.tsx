"use client";

import { ChevronsLeftRight } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";

function Scene({ dusk }: { dusk: boolean }) {
  return (
    <div
      className={`absolute inset-0 ${dusk ? "bg-linear-to-b from-(--em-ink-950) via-(--em-blue-900) to-(--em-blue-700)" : "bg-linear-to-b from-(--em-sky-400) via-(--em-blue-400) to-(--em-blue-600)"}`}
    >
      <span
        className={`absolute top-6 right-8 size-12 rounded-full ${dusk ? "bg-(--em-ink-100)" : "bg-(--em-gold-300)"}`}
      />
      <span className="absolute inset-x-0 bottom-0 h-2/5 bg-(--em-ink-900)/60 [clip-path:polygon(0_60%,20%_20%,38%_55%,60%_0,82%_45%,100%_25%,100%_100%,0_100%)]" />
      <span className="absolute inset-x-0 bottom-0 h-1/5 bg-(--em-ink-950)/80" />
    </div>
  );
}

/** Before / after: drag the divider (or focus it and use the arrow keys) to compare two versions. */
export default function CompareSlider() {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || e.buttons !== 1) return;
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div
        ref={box}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        className="relative aspect-video w-full max-w-md touch-none overflow-hidden rounded-xl select-none"
      >
        <Scene dusk={false} />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${String(100 - pos)}% 0 0)` }}
        >
          <Scene dusk />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-(--em-ink-975)/70 px-2 py-0.5 text-xs text-(--em-ink-50)">
          กลางคืน
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-(--em-ink-975)/70 px-2 py-0.5 text-xs text-(--em-ink-50)">
          กลางวัน
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-label="เลื่อนเพื่อเปรียบเทียบ"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 cursor-ew-resize bg-(--em-ink-0) outline-none focus-visible:ring-2 focus-visible:ring-(--em-sky-400)"
          style={{ left: `${String(pos)}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full bg-(--em-ink-0) text-(--em-ink-900) shadow-lg">
            <ChevronsLeftRight aria-hidden className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
