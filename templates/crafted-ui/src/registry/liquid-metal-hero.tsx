"use client";

import { motion } from "framer-motion";

export interface LiquidMetalHeroProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  tint?: string;
  speed?: number;
}

export function LiquidMetalHero({
  badge = "Next Generation UI",
  title = "Fluid Design Excellence",
  subtitle = "Interfaces with a liquid metal finish that adapt to every screen.",
  primaryCtaLabel = "Start Building",
  tint = "#a5b4fc",
  speed = 12,
}: LiquidMetalHeroProps) {
  return (
    <div className="relative flex min-h-[360px] w-full flex-col items-center justify-center overflow-hidden bg-black px-6 py-16 text-center">
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: `conic-gradient(from 0deg, #18181b, ${tint}, #e4e4e7, #27272a, ${tint}, #18181b)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_70%)]" aria-hidden />
      <span className="relative rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">{badge}</span>
      <h1 className="relative mt-5 bg-gradient-to-b from-white via-zinc-300 to-zinc-500 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
        {title}
      </h1>
      <p className="relative mt-4 max-w-md text-sm text-zinc-400">{subtitle}</p>
      <button type="button" className="relative mt-7 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[1.03]">
        {primaryCtaLabel}
      </button>
    </div>
  );
}

export default LiquidMetalHero;
