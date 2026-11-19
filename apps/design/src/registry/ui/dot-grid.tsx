import type { CSSProperties } from "react";

const cols = 22;
const rows = 12;

/** A grid of dots that light up in a wave running out from the centre (CSS keyframes, transform + opacity). */
export default function DotGrid({ gap = 22, speed = 3 }: { gap?: number; speed?: number }) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes dot-grid-pulse{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(1.9)}}.dot-grid-dot{animation:dot-grid-pulse var(--speed) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.dot-grid-dot{animation:none}}`}</style>
      <div
        aria-hidden
        className="vt-live grid"
        style={{ gridTemplateColumns: `repeat(${cols}, ${gap}px)`, gridAutoRows: `${gap}px` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const x = (i % cols) - (cols - 1) / 2;
          const y = Math.floor(i / cols) - (rows - 1) / 2;
          return (
            <span
              key={i}
              className="dot-grid-dot m-auto size-1 rounded-full bg-(--em-sky-400)"
              style={
                {
                  "--speed": `${speed}s`,
                  animationDelay: `${Math.hypot(x, y) * speed * 0.06}s`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}
