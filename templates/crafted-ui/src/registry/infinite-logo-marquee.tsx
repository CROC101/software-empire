"use client";

import { Box, Cloud, Cpu, Feather, Globe, Hexagon, Layers, Rocket, Triangle, Zap } from "lucide-react";

export interface InfiniteLogoMarqueeProps {
  speed?: number;
  gap?: number;
  rows?: "1" | "2";
  pauseOnHover?: boolean;
  fadeEdges?: boolean;
}

const LOGOS = [
  { name: "Northwind", Icon: Triangle },
  { name: "Globex", Icon: Globe },
  { name: "Hooli", Icon: Hexagon },
  { name: "Initech", Icon: Cpu },
  { name: "Stratus", Icon: Cloud },
  { name: "Layerly", Icon: Layers },
  { name: "Boxwood", Icon: Box },
  { name: "Voltage", Icon: Zap },
  { name: "Quill", Icon: Feather },
  { name: "Launchpad", Icon: Rocket },
];

function Row({ reverse, speed, gap, pauseOnHover }: { reverse: boolean; speed: number; gap: number; pauseOnHover: boolean }) {
  const items = reverse ? [...LOGOS].reverse() : LOGOS;
  return (
    <div className={`flex w-max ${pauseOnHover ? "[&:hover]:[animation-play-state:paused]" : ""}`} style={{ gap, animation: `marquee-x ${speed}s linear infinite ${reverse ? "reverse" : ""}` }}>
      {[...items, ...items].map(({ name, Icon }, i) => (
        <span key={i} aria-hidden={i >= items.length} className="flex shrink-0 items-center gap-2 text-lg font-semibold text-zinc-400 transition-colors hover:text-white">
          <Icon className="size-5" />
          {name}
        </span>
      ))}
    </div>
  );
}

export function InfiniteLogoMarquee({ speed = 30, gap = 48, rows = "2", pauseOnHover = true, fadeEdges = true }: InfiniteLogoMarqueeProps) {
  const mask = fadeEdges ? "linear-gradient(to right, transparent, black 15%, black 85%, transparent)" : undefined;
  return (
    <div className="flex w-full flex-col overflow-hidden py-8" style={{ gap: 24, maskImage: mask, WebkitMaskImage: mask }}>
      <style>{`@keyframes marquee-x{from{transform:translateX(0)}to{transform:translateX(calc(-50% - ${gap / 2}px))}}`}</style>
      <Row reverse={false} speed={speed} gap={gap} pauseOnHover={pauseOnHover} />
      {rows === "2" && <Row reverse speed={speed * 1.2} gap={gap} pauseOnHover={pauseOnHover} />}
    </div>
  );
}

export default InfiniteLogoMarquee;
