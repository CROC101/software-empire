"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";

export interface MagneticSpotlightCardProps {
  title?: string;
  description?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  tiltStrength?: number;
  showBorderGlow?: boolean;
}

export function MagneticSpotlightCard({
  title = "Ship faster with AI",
  description = "A glass card whose border follows your cursor, with a soft 3D tilt.",
  spotlightColor = "#8b5cf6",
  spotlightSize = 320,
  tiltStrength = 10,
  showBorderGlow = true,
}: MagneticSpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const rx = useSpring(0, { stiffness: 400, damping: 30 });
  const ry = useSpring(0, { stiffness: 400, damping: 30 });
  const glow = useMotionTemplate`radial-gradient(${spotlightSize}px circle at ${x}px ${y}px, ${spotlightColor}55, transparent 60%)`;
  const border = useMotionTemplate`radial-gradient(${spotlightSize * 0.7}px circle at ${x}px ${y}px, ${spotlightColor}, transparent 70%)`;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    x.set(px);
    y.set(py);
    ry.set(((px / r.width) - 0.5) * tiltStrength * 2);
    rx.set(-((py / r.height) - 0.5) * tiltStrength * 2);
  }

  function onLeave() {
    x.set(-1000);
    y.set(-1000);
    rx.set(0);
    ry.set(0);
  }

  return (
    <div style={{ perspective: 900 }} className="flex w-full items-center justify-center p-6">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative w-full max-w-sm rounded-2xl p-px will-change-transform"
      >
        {showBorderGlow && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: border }} />
        )}
        <div className="absolute inset-0 rounded-2xl bg-white/10" aria-hidden />
        <div className="relative overflow-hidden rounded-[15px] bg-zinc-950/90 p-6 backdrop-blur-xl">
          <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glow }} />
          <div className="relative" style={{ transform: "translateZ(40px)" }}>
            <div className="mb-10 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Sparkles className="size-5" style={{ color: spotlightColor }} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MagneticSpotlightCard;
