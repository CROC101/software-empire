import type { CSSProperties } from "react";

const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const cols = 32;
const rows = 18;

/** Squares switch on and off at random like office windows at night. Seeded, so it never jumps on hydrate. */
export default function FlickerSquares({
  size = 18,
  density = 0.2,
}: {
  size?: number;
  density?: number;
}) {
  return (
    <div className="relative grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes flicker-squares-blink{0%,100%{opacity:.08}50%{opacity:var(--o)}}.flicker-squares-c{animation:flicker-squares-blink var(--t) steps(2,jump-none) infinite}@media (prefers-reduced-motion:reduce){.flicker-squares-c{animation:none;opacity:.15}}`}</style>
      <div
        aria-hidden
        className="vt-live grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridAutoRows: `${size}px` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const lit = rand(i) < density;
          return (
            <span
              key={i}
              className={lit ? "flicker-squares-c bg-(--em-sky-400)" : "bg-(--em-ink-800)/50"}
              style={
                lit
                  ? ({
                      "--t": `${1.5 + rand(i + 99) * 4}s`,
                      "--o": `${0.4 + rand(i + 7) * 0.6}`,
                      animationDelay: `${rand(i + 3) * -5}s`,
                    } as CSSProperties)
                  : undefined
              }
            />
          );
        })}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--em-ink-975)_80%)]"
      />
    </div>
  );
}
