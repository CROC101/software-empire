"use client";

export interface AuroraMeshBackgroundProps {
  title?: string;
  colorA?: string;
  colorB?: string;
  colorC?: string;
  speed?: number;
  blur?: number;
  showGrain?: boolean;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export function AuroraMeshBackground({
  title = "Build at the speed of thought",
  colorA = "#6366f1",
  colorB = "#06b6d4",
  colorC = "#ec4899",
  speed = 18,
  blur = 60,
  showGrain = true,
}: AuroraMeshBackgroundProps) {
  const blob = "absolute size-[70%] rounded-full mix-blend-screen opacity-70 will-change-transform";
  return (
    <div className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden bg-zinc-950">
      <style>{`@keyframes aurora-drift{0%{transform:translate3d(-10%,-6%,0) rotate(0deg) scale(1)}50%{transform:translate3d(8%,6%,0) rotate(160deg) scale(1.15)}100%{transform:translate3d(-10%,-6%,0) rotate(360deg) scale(1)}}`}</style>
      <div className="absolute inset-0" style={{ filter: `blur(${blur}px)` }} aria-hidden>
        <div className={`${blob} -left-[10%] -top-[20%]`} style={{ background: colorA, animation: `aurora-drift ${speed}s linear infinite` }} />
        <div className={`${blob} -right-[15%] top-[10%]`} style={{ background: colorB, animation: `aurora-drift ${speed * 1.3}s linear infinite reverse` }} />
        <div className={`${blob} bottom-[-30%] left-[20%]`} style={{ background: colorC, animation: `aurora-drift ${speed * 0.8}s linear infinite` }} />
      </div>
      {showGrain && <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay" style={{ backgroundImage: GRAIN }} aria-hidden />}
      <p className="relative max-w-md px-6 text-center text-3xl font-semibold tracking-tight text-white drop-shadow sm:text-4xl">{title}</p>
    </div>
  );
}

export default AuroraMeshBackground;
