import type { CSSProperties } from "react";

/** A still picture that slowly zooms and pans, like a documentary. Pure CSS; reduced motion holds still. */
export default function KenBurns({ duration = 6 }: { duration?: number }) {
  const t = Math.min(12, Math.max(3, duration));
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes ken-burns-drift{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.25) translate(-6%,-4%)}}.ken-burns-pic{animation:ken-burns-drift var(--t) ease-in-out infinite alternate}@media (prefers-reduced-motion:reduce){.ken-burns-pic{animation:none}}`}</style>
      <figure className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl">
        <div
          aria-hidden
          className="ken-burns-pic vt-live absolute inset-0 origin-[70%_40%] bg-linear-to-b from-(--em-blue-800) via-(--em-blue-600) to-(--em-sky-400)"
          style={{ "--t": `${String(t)}s` } as CSSProperties}
        >
          <span className="absolute top-[18%] right-[22%] size-10 rounded-full bg-(--em-ink-50)" />
          <span className="absolute inset-x-0 bottom-[30%] h-1/3 bg-(--em-ink-900)/70 [clip-path:polygon(0_70%,15%_30%,30%_60%,48%_10%,65%_55%,80%_25%,100%_60%,100%_100%,0_100%)]" />
          <span className="absolute inset-x-0 bottom-0 h-[32%] bg-linear-to-b from-(--em-blue-900) to-(--em-ink-975)" />
        </div>
        <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-(--em-ink-975)/90 to-transparent p-4">
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
            chapter 01
          </p>
          <p className="font-heading text-xl font-black text-(--em-ink-0)">คืนพระจันทร์เต็มดวง</p>
        </figcaption>
      </figure>
    </div>
  );
}
