import type { CSSProperties } from "react";

/** A perspective floor grid runs toward a glowing horizon; the grid moves by one cell per loop. */
export default function GridHorizon({
  speed = 1.5,
  glow = true,
}: {
  speed?: number;
  glow?: boolean;
}) {
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-(--em-ink-975)">
      <style>{`@keyframes grid-horizon-run{to{transform:translateY(48px)}}.grid-horizon-floor{animation:grid-horizon-run var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.grid-horizon-floor{animation:none}}`}</style>
      {glow && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-[38%] h-24 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,var(--em-sky-400),transparent_70%)] opacity-30"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 top-[45%] bottom-0 overflow-hidden [perspective:320px]"
      >
        <div className="absolute inset-x-[-50%] top-0 h-[200%] origin-top [transform:rotateX(62deg)]">
          <div
            className="grid-horizon-floor vt-live absolute inset-x-0 -top-12 bottom-0"
            style={
              {
                "--t": `${speed}s`,
                backgroundImage:
                  "linear-gradient(var(--em-blue-500) 1px, transparent 1px), linear-gradient(90deg, var(--em-blue-500) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                opacity: 0.55,
              } as CSSProperties
            }
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-(--em-ink-975) to-transparent" />
      </div>
      <div aria-hidden className="absolute inset-x-0 top-[45%] h-px bg-(--em-sky-400) opacity-80" />
    </div>
  );
}
