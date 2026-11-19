import type { CSSProperties } from "react";

/** Water wells up inside the button on hover; its surface keeps lapping while it is full. */
export default function LiquidButton({ label = "ลงน้ำ" }: { label?: string }) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes liquid-button-lap{to{transform:translateX(-50%)}}.liquid-button-wave{animation:liquid-button-lap var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.liquid-button-wave{animation:none}}`}</style>
      <button
        type="button"
        className="group relative overflow-hidden rounded-lg border border-(--em-sky-400) px-10 py-4 font-semibold text-(--em-sky-400) transition-colors duration-500 hover:text-(--em-ink-0) active:scale-95"
      >
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-2 h-[calc(100%+1rem)] translate-y-full transition-transform duration-700 ease-out group-hover:translate-y-2 group-focus-visible:translate-y-2 motion-reduce:transition-none"
        >
          {[
            { t: "3s", c: "var(--em-blue-500)", o: 1 },
            { t: "5s", c: "var(--em-sky-400)", o: 0.5 },
          ].map((w) => (
            <svg
              key={w.t}
              viewBox="0 0 400 40"
              preserveAspectRatio="none"
              className="liquid-button-wave vt-live absolute -top-3 left-0 h-4 w-[200%]"
              style={{ "--t": w.t, opacity: w.o } as CSSProperties}
            >
              <path d="M0 20 Q50 0 100 20 T200 20 T300 20 T400 20 V40 H0 Z" fill={w.c} />
            </svg>
          ))}
          <span className="absolute inset-x-0 top-0.5 bottom-0 bg-(--em-blue-500)" />
        </span>
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}
