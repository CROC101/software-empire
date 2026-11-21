"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useRef } from "react";

const mix = (token: string, pct: number) =>
  `color-mix(in oklab, var(${token}) ${String(pct)}%, transparent)`;

/**
 * A glass ball with a slow current turning inside it. The light on its skin follows the pointer and
 * the inside shifts the other way, so it reads as a sphere. Pure CSS; reduced motion stops the turn.
 */
export default function GlassOrb({ size = 240, spin = 24 }: { size?: number; spin?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = (x: number, y: number) => {
    ref.current?.style.setProperty("--px", x.toFixed(3));
    ref.current?.style.setProperty("--py", y.toFixed(3));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) tilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <div
      onPointerMove={move}
      onPointerLeave={() => {
        tilt(0, 0);
      }}
      className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6"
    >
      <style>{`@keyframes glass-orb-turn{to{transform:rotate(1turn)}}.glass-orb-core{animation:glass-orb-turn var(--spin) linear infinite}@media (prefers-reduced-motion:reduce){.glass-orb-core{animation:none}}`}</style>
      <div className="grid justify-items-center gap-3">
        <div
          ref={ref}
          role="img"
          aria-label="ลูกแก้วใสมีกระแสน้ำหมุนอยู่ข้างใน"
          className="relative overflow-hidden rounded-full bg-(--em-ink-950)"
          style={
            {
              width: size,
              height: size,
              "--px": 0,
              "--py": 0,
              "--spin": `${String(spin)}s`,
            } as CSSProperties
          }
        >
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{ transform: "translate(calc(var(--px) * -28px), calc(var(--py) * -28px))" }}
          >
            <div
              className="glass-orb-core vt-live absolute -inset-1/4"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${mix("--em-sky-400", 45)} 12%, transparent 26%, ${mix("--em-blue-500", 55)} 44%, transparent 58%, ${mix("--em-sky-500", 35)} 74%, transparent 88%)`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 110%, ${mix("--em-blue-700", 90)}, transparent 65%)`,
              }}
            />
          </div>
          <div
            className="absolute top-[12%] left-[18%] size-1/3 rounded-full transition-transform duration-500 ease-out"
            style={{
              background: `radial-gradient(circle, ${mix("--em-ink-0", 70)}, transparent 65%)`,
              transform: "translate(calc(var(--px) * 40px), calc(var(--py) * 40px))",
            }}
          />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_-12px_36px_var(--em-ink-975)] ring-1 ring-(--em-sky-400)/25 ring-inset" />
        </div>
        <div
          aria-hidden
          className="h-3 rounded-full bg-(--em-ink-0)/10 blur-sm"
          style={{ width: size * 0.6 }}
        />
      </div>
    </div>
  );
}
