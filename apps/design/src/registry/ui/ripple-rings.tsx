import { Waves } from "lucide-react";
import type { CSSProperties } from "react";

/** Rings of water spread from the centre one after another, forever (scale + opacity). */
export default function RippleRings({
  rings = 4,
  duration = 4,
}: {
  rings?: number;
  duration?: number;
}) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes ripple-rings-grow{from{transform:scale(.05);opacity:.9}to{transform:scale(1);opacity:0}}.ripple-rings-ring{animation:ripple-rings-grow var(--t) cubic-bezier(.2,.6,.3,1) infinite}@media (prefers-reduced-motion:reduce){.ripple-rings-ring{animation:none;opacity:.25}}`}</style>
      {Array.from({ length: rings }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="ripple-rings-ring vt-live absolute aspect-square w-[min(90%,28rem)] rounded-full border border-(--em-sky-400)"
          style={
            {
              "--t": `${duration}s`,
              animationDelay: `${(i * duration) / rings}s`,
              transform: `scale(${(i + 1) / (rings + 1)})`,
            } as CSSProperties
          }
        />
      ))}
      <span className="relative grid size-14 place-items-center rounded-full bg-(--em-blue-600) text-(--em-ink-50) shadow-lg">
        <Waves aria-hidden className="size-6" />
      </span>
    </div>
  );
}
