"use client";

import { ArrowRight } from "lucide-react";

export interface BorderBeamButtonProps {
  label?: string;
  beamColor?: string;
  duration?: number;
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}

const SIZES = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-sm", lg: "h-14 px-8 text-base" } as const;

export function BorderBeamButton({
  label = "Get started",
  beamColor = "#22d3ee",
  duration = 3,
  size = "md",
  showArrow = true,
}: BorderBeamButtonProps) {
  return (
    <div className="flex w-full items-center justify-center p-6">
      <style>{`@property --beam-angle{syntax:"<angle>";initial-value:0deg;inherits:false}@keyframes beam-spin{to{--beam-angle:360deg}}`}</style>
      <button
        type="button"
        className="group relative inline-flex items-center justify-center rounded-full p-px transition-transform active:scale-[0.97]"
        style={{
          background: `conic-gradient(from var(--beam-angle), transparent 0deg, transparent 280deg, ${beamColor} 330deg, white 350deg, transparent 360deg), rgba(255,255,255,0.12)`,
          animation: `beam-spin ${duration}s linear infinite`,
        }}
      >
        <span className={`relative inline-flex items-center gap-2 rounded-full bg-zinc-950 font-medium text-white ${SIZES[size]}`}>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            style={{ background: `radial-gradient(60% 120% at 50% 120%, ${beamColor}40, transparent)` }}
          />
          <span className="relative">{label}</span>
          {showArrow && <ArrowRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />}
        </span>
      </button>
    </div>
  );
}

export default BorderBeamButton;
