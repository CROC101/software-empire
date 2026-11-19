import type { CSSProperties } from "react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Bubbles rise from the bottom of the water, each with its own size, speed and wobble. */
export default function BubbleRise({ count = 18 }: { count?: number }) {
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-linear-to-b from-(--em-blue-700) to-(--em-ink-975)">
      <style>{`@keyframes bubble-rise-up{from{transform:translate(0,0);opacity:0}10%{opacity:.9}50%{transform:translate(var(--dx),-60cqh)}to{transform:translate(0,-125cqh);opacity:0}}.bubble-rise-b{animation:bubble-rise-up var(--t) ease-in infinite}@media (prefers-reduced-motion:reduce){.bubble-rise-b{animation:none;opacity:.4;transform:translateY(-40cqh)}}`}</style>
      <div className="@container absolute inset-0">
        {Array.from({ length: count }, (_, i) => {
          const size = 6 + rand(i) * 22;
          return (
            <span
              key={i}
              aria-hidden
              className="bubble-rise-b vt-live absolute -bottom-8 rounded-full border border-(--em-sky-400)/70 bg-(--em-sky-400)/10"
              style={
                {
                  left: `${rand(i + 40) * 96}%`,
                  width: size,
                  height: size,
                  "--t": `${4 + rand(i + 7) * 6}s`,
                  "--dx": `${(rand(i + 3) - 0.5) * 40}px`,
                  animationDelay: `${rand(i + 11) * -10}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}
