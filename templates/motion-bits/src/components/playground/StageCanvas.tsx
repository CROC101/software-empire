"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StageBackground = "dark" | "dots" | "checker" | "light";

const BACKGROUNDS: { id: StageBackground; label: string; style: React.CSSProperties }[] = [
  { id: "dark", label: "Dark", style: { background: "#060010" } },
  {
    id: "dots",
    label: "Dot Grid",
    style: { background: "#060010", backgroundImage: "radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px)", backgroundSize: "18px 18px" },
  },
  {
    id: "checker",
    label: "Checkered",
    style: {
      backgroundColor: "#14111a",
      backgroundImage:
        "linear-gradient(45deg,#1f1a27 25%,transparent 25%),linear-gradient(-45deg,#1f1a27 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1f1a27 75%),linear-gradient(-45deg,transparent 75%,#1f1a27 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
    },
  },
  { id: "light", label: "Light", style: { background: "#F8FAFC" } },
];

function useFps() {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

export default function StageCanvas({
  children,
  onReplay,
  fill,
  background,
  onBackgroundChange,
}: {
  children: ReactNode;
  onReplay: () => void;
  fill?: boolean;
  background: StageBackground;
  onBackgroundChange: (b: StageBackground) => void;
}) {
  const fps = useFps();
  const bg = BACKGROUNDS.find((b) => b.id === background)!;
  return (
    <div className="card-shell">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 pb-2">
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Stage background">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              role="radio"
              aria-checked={background === b.id}
              onClick={() => onBackgroundChange(b.id)}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium transition",
                background === b.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          onClick={onReplay}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white/[0.06] px-2.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
          title="Replay animation (R)"
        >
          <RotateCcw className="size-3.5" /> Replay
        </button>
      </div>
      <div className="card-well relative h-[460px] overflow-hidden max-tab:h-[360px]" style={bg.style}>
        <span
          className={cn(
            "absolute top-3 right-3 z-20 rounded-md px-2 py-1 font-mono text-[11px] font-medium backdrop-blur",
            fps >= 50 ? "bg-emerald-500/15 text-emerald-300" : fps >= 30 ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300",
          )}
          aria-live="off"
        >
          {fps} FPS
        </span>
        <div className={cn("h-full w-full", !fill && "flex items-center justify-center overflow-auto p-6")}>{children}</div>
      </div>
    </div>
  );
}
