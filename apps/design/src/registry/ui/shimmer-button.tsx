import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

/** A flash of light sweeps across the button on a loop, with a pause between sweeps. */
export default function ShimmerButton({
  label = "อัปเกรด",
  speed = 2.5,
}: {
  label?: string;
  speed?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes shimmer-button-sweep{0%{transform:translateX(-120%) skewX(-20deg)}60%,100%{transform:translateX(320%) skewX(-20deg)}}.shimmer-button-flash{animation:shimmer-button-sweep var(--t) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.shimmer-button-flash{display:none}}`}</style>
      <button
        type="button"
        className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-(--em-blue-400)/40 bg-(--em-ink-900) px-7 py-3.5 font-semibold text-(--em-ink-50) transition-transform active:scale-95"
      >
        <span
          aria-hidden
          className="shimmer-button-flash vt-live absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-(--em-sky-400)/60 to-transparent"
          style={{ "--t": `${speed}s` } as CSSProperties}
        />
        <Sparkles aria-hidden className="relative size-4 text-(--em-sky-400)" />
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}
