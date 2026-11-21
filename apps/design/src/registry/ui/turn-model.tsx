"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const S = 120;
const faces = [
  { t: "rotateY(0deg)", label: "หน้า", tone: "bg-(--em-blue-600)" },
  { t: "rotateY(90deg)", label: "ขวา", tone: "bg-(--em-blue-700)" },
  { t: "rotateY(180deg)", label: "หลัง", tone: "bg-(--em-blue-800)" },
  { t: "rotateY(-90deg)", label: "ซ้าย", tone: "bg-(--em-blue-700)" },
  { t: "rotateX(90deg)", label: "บน", tone: "bg-(--em-sky-500)" },
  { t: "rotateX(-90deg)", label: "ล่าง", tone: "bg-(--em-ink-800)" },
];

/** A product box on a turntable: it spins slowly on its own, and you can drag it round to look at any side. */
export default function TurnModel({ autoSpin = true }: { autoSpin?: boolean }) {
  const still = useReducedMotion();
  const ry = useMotionValue(-30);
  const rx = useMotionValue(-20);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!autoSpin || still || held) return;
    const a = animate(ry, ry.get() + 360, { duration: 12, ease: "linear", repeat: Infinity });
    return () => {
      a.stop();
    };
  }, [autoSpin, still, held, ry]);
  return (
    <div
      role="img"
      aria-label="กล่องสินค้าสามมิติ ลากเพื่อหมุน"
      className="grid size-full min-h-72 cursor-grab touch-none place-items-center bg-(--em-ink-975) p-6 active:cursor-grabbing"
      style={{ perspective: 800 }}
      onPointerDown={() => {
        setHeld(true);
      }}
      onPointerUp={() => {
        setHeld(false);
      }}
      onPointerLeave={() => {
        setHeld(false);
      }}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        ry.set(ry.get() + e.movementX * 0.5);
        rx.set(Math.max(-60, Math.min(60, rx.get() - e.movementY * 0.5)));
      }}
    >
      <motion.div
        className={autoSpin ? "vt-live" : ""}
        style={{ width: S, height: S, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      >
        {faces.map((f) => (
          <span
            key={f.label}
            aria-hidden
            className={`absolute inset-0 grid place-items-center border border-(--em-ink-0)/20 text-sm font-semibold text-(--em-ink-0) ${f.tone}`}
            style={{ transform: `${f.t} translateZ(${String(S / 2)}px)` }}
          >
            {f.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
