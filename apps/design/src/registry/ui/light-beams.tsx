import type { CSSProperties } from "react";

const tones = {
  blue: "var(--em-blue-400)",
  sky: "var(--em-sky-400)",
  violet: "var(--em-violet-400)",
  teal: "var(--em-teal-400)",
} as const;

/** seeded so server and client draw the same beams */
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Thin beams of light fall top to bottom at their own pace, like rain made of light. */
export default function LightBeams({
  count = 12,
  tone = "sky",
}: {
  count?: number;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes light-beams-fall{from{transform:translateY(-110%);opacity:0}15%{opacity:1}to{transform:translateY(320%);opacity:0}}.light-beams-beam{animation:light-beams-fall var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.light-beams-beam{animation:none;opacity:.35;transform:translateY(60%)}}`}</style>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="light-beams-beam vt-live absolute top-0 h-1/3 w-px"
          style={
            {
              left: `${(i + 0.5) * (100 / count) + (rand(i) - 0.5) * 4}%`,
              background: `linear-gradient(to bottom, transparent, ${tones[tone]})`,
              "--t": `${2.5 + rand(i + 9) * 3}s`,
              animationDelay: `${rand(i + 3) * -5}s`,
            } as CSSProperties
          }
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-(--em-blue-700)/40 to-transparent"
      />
    </div>
  );
}
