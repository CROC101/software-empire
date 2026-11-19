import type { CSSProperties } from "react";

const colors = [
  "--em-sky-400",
  "--em-blue-400",
  "--em-blue-600",
  "--em-violet-500",
  "--em-teal-400",
  "--em-blue-800",
];

/** One seamless sine path, twice as wide as the stage, so sliding it by half loops without a seam. */
function wavePath(amp: number, waves: number) {
  const w = 1200;
  const seg = w / (waves * 2);
  let d = `M0 50`;
  for (let i = 0; i < waves * 2; i++) {
    const x = (i + 1) * seg;
    d += ` Q${x - seg / 2} ${i % 2 ? 50 + amp : 50 - amp} ${x} 50`;
  }
  return d;
}

/** Layers of wavy lines slide against each other like a water surface (translateX only). */
export default function WaveLines({ layers = 4, speed = 10 }: { layers?: number; speed?: number }) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes wave-lines-slide{to{transform:translateX(-50%)}}.wave-lines-row{animation:wave-lines-slide var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.wave-lines-row{animation:none}}`}</style>
      <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        {Array.from({ length: layers }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 1200 100"
            preserveAspectRatio="none"
            className="wave-lines-row vt-live -mt-10 block h-24 w-[200%]"
            style={
              {
                "--t": `${speed * (1 + i * 0.35)}s`,
                animationDirection: i % 2 ? "reverse" : "normal",
                opacity: 1 - i * 0.12,
              } as CSSProperties
            }
          >
            <path
              d={wavePath(14 + i * 6, 3 + i)}
              fill="none"
              stroke={`var(${colors[i % colors.length] ?? "--em-sky-400"})`}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}
