import type { CSSProperties } from "react";

/**
 * A band of light sweeps across the letters. The band is a window that slides one way while the
 * bright copy inside slides the other way, so the copy stays still: pure transform, no
 * background-position animation.
 */
export default function ShineText({
  text = "ของใหม่มาแล้ว",
  speed = 3,
}: {
  text?: string;
  speed?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes shine-text-win{from{transform:translateX(-100%)}to{transform:translateX(300%)}}@keyframes shine-text-copy{from{transform:translateX(33.333%)}to{transform:translateX(-100%)}}.shine-text-win{animation:shine-text-win var(--t) ease-in-out infinite}.shine-text-copy{animation:shine-text-copy var(--t) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.shine-text-win{display:none}}`}</style>
      <p className="relative inline-block font-heading text-4xl font-black whitespace-nowrap text-(--em-ink-500) sm:text-6xl">
        {text}
        <span
          aria-hidden
          className="shine-text-win vt-live absolute inset-y-0 left-0 w-1/3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_40%,#000_60%,transparent)]"
          style={{ "--t": `${speed}s` } as CSSProperties}
        >
          <span
            className="shine-text-copy absolute inset-y-0 left-0 w-[300%] text-(--em-ink-0)"
            style={{ "--t": `${speed}s` } as CSSProperties}
          >
            {text}
          </span>
        </span>
      </p>
    </div>
  );
}
