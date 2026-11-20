import type { CSSProperties } from "react";

/**
 * The letters are filled with moving water: sky to deep blue, flowing sideways and back. The
 * gradient is the house water ramp, so it stays on palette in both themes.
 */
export default function TideGradient({
  text = "น้ำขึ้นให้รีบตัก",
  speed = 6,
}: {
  text?: string;
  speed?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      {/* shortcut: animates background-position (repaints the glyphs only), fine for one heading, use an SVG gradient transform if it ever runs in a long list */}
      <style>{`@keyframes tide-gradient{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}.tide-gradient{background-image:linear-gradient(100deg,var(--em-sky-400),var(--em-blue-500),var(--em-blue-700),var(--em-sky-400));background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:tide-gradient var(--t) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.tide-gradient{animation:none}}`}</style>
      <h2
        className="tide-gradient vt-live font-heading text-5xl leading-tight font-black sm:text-7xl"
        style={{ "--t": `${speed}s` } as CSSProperties}
      >
        {text}
      </h2>
    </div>
  );
}
