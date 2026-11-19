"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const VIEWPORTS = { desktop: { label: "Desktop", width: "100%" }, tablet: { label: "Tablet", width: 768 }, mobile: { label: "Mobile", width: 375 } } as const;
export type Viewport = keyof typeof VIEWPORTS;

export const CANVASES = {
  dark: { label: "Pure Dark", style: { background: "#09090B" } },
  dots: { label: "Dot grid", style: { background: "#09090B", backgroundImage: "radial-gradient(#ffffff26 1px, transparent 1px)", backgroundSize: "18px 18px" } },
  grid: { label: "Line grid", style: { background: "#09090B", backgroundImage: "linear-gradient(#ffffff12 1px,transparent 1px),linear-gradient(90deg,#ffffff12 1px,transparent 1px)", backgroundSize: "28px 28px" } },
  light: { label: "Light", style: { background: "#FAFAFA" } },
} as const;
export type Canvas = keyof typeof CANVASES;

/** Spring-animated width box around the live preview. */
export function ViewportFrame({ viewport, canvas, minHeight, children }: { viewport: Viewport; canvas: Canvas; minHeight: number; children: React.ReactNode }) {
  const w = VIEWPORTS[viewport].width;
  return (
    <div className="flex h-full w-full justify-center overflow-auto p-3 md:p-6" style={CANVASES[canvas].style}>
      <motion.div
        layout
        animate={{ width: w }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn("relative flex max-w-full items-center justify-center overflow-hidden", viewport !== "desktop" && "rounded-[14px] ring-1 ring-white/10")}
        style={{ minHeight }}
      >
        {children}
      </motion.div>
    </div>
  );
}
