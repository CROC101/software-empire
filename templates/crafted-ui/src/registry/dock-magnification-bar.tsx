"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Camera, Compass, FolderOpen, Mail, Music, Settings, Terminal } from "lucide-react";

export interface DockMagnificationBarProps {
  iconSize?: number;
  magnification?: number;
  distance?: number;
  showLabels?: boolean;
}

const APPS = [
  { label: "Finder", Icon: FolderOpen, color: "#3b82f6" },
  { label: "Safari", Icon: Compass, color: "#06b6d4" },
  { label: "Mail", Icon: Mail, color: "#60a5fa" },
  { label: "Music", Icon: Music, color: "#f43f5e" },
  { label: "Photos", Icon: Camera, color: "#f59e0b" },
  { label: "Terminal", Icon: Terminal, color: "#a1a1aa" },
  { label: "Settings", Icon: Settings, color: "#71717a" },
];

function DockIcon({
  mouseX,
  label,
  Icon,
  color,
  iconSize,
  magnification,
  distance,
  showLabels,
}: (typeof APPS)[number] & { mouseX: MotionValue<number> } & Required<DockMagnificationBarProps>) {
  const ref = useRef<HTMLButtonElement>(null);
  const dist = useTransform(mouseX, (v) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? v - r.left - r.width / 2 : Infinity;
  });
  const target = useTransform(dist, [-distance, 0, distance], [iconSize, iconSize * magnification, iconSize]);
  const size = useSpring(target, { stiffness: 400, damping: 30, mass: 0.2 });

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      style={{ width: size, height: size }}
      className="group relative flex shrink-0 items-center justify-center rounded-[22%] border border-white/10 bg-gradient-to-b from-white/15 to-white/5"
    >
      <Icon className="size-1/2" style={{ color }} />
      {showLabels && (
        <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </span>
      )}
    </motion.button>
  );
}

export function DockMagnificationBar({
  iconSize = 44,
  magnification = 1.8,
  distance = 140,
  showLabels = true,
}: DockMagnificationBarProps) {
  const mouseX = useMotionValue(Infinity);
  return (
    <div className="flex w-full items-end justify-center p-6 pt-20">
      <div
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        className="flex max-w-full items-end gap-2 overflow-visible rounded-2xl border border-white/10 bg-white/5 px-2.5 pb-2.5 pt-2.5 backdrop-blur-xl"
        style={{ height: iconSize + 20 }}
      >
        {APPS.map((app) => (
          <DockIcon
            key={app.label}
            {...app}
            mouseX={mouseX}
            iconSize={iconSize}
            magnification={magnification}
            distance={distance}
            showLabels={showLabels}
          />
        ))}
      </div>
    </div>
  );
}

export default DockMagnificationBar;
