"use client";

import { motion } from "motion/react";

const blobs = [
  { color: "var(--em-blue-500)", x: ["-30%", "20%", "-30%"], y: ["-20%", "25%", "-20%"] },
  { color: "var(--em-sky-400)", x: ["35%", "-15%", "35%"], y: ["10%", "-25%", "10%"] },
  { color: "var(--em-violet-500)", x: ["10%", "40%", "10%"], y: ["35%", "0%", "35%"] },
  { color: "var(--em-teal-400)", x: ["-35%", "-5%", "-35%"], y: ["30%", "-10%", "30%"] },
];

/** Four blurred colour blobs drift across each other on slow loops, like coloured cloud under water. */
export default function MeshDrift({ blur = 90, speed = 20 }: { blur?: number; speed?: number }) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      {blobs.map((b, i) => (
        <motion.div
          key={b.color}
          aria-hidden
          className="vt-live absolute top-1/4 left-1/4 size-1/2 rounded-full opacity-60"
          style={{ background: b.color, filter: `blur(${blur}px)` }}
          animate={{ x: b.x, y: b.y }}
          transition={{ duration: speed * (1 + i * 0.2), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <p className="relative font-heading text-3xl font-black text-(--em-ink-50)">Mesh Drift</p>
    </div>
  );
}
