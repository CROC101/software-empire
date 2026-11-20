import type { CSSProperties } from "react";

/**
 * A folded note: the top half of the word swings down over the bottom half and opens again, with a
 * shadow that darkens the crease while it is closed.
 */
export default function PaperFold({
  text = "พับแล้วกาง",
  speed = 3,
}: {
  text?: string;
  speed?: number;
}) {
  const half = "col-start-1 row-start-1 whitespace-nowrap";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 [perspective:700px]">
      <style>{`@keyframes paper-fold{0%,25%,100%{transform:rotateX(0)}50%,70%{transform:rotateX(-170deg)}}@keyframes paper-fold-shade{0%,25%,100%{opacity:0}50%,70%{opacity:.55}}.paper-fold-top{animation:paper-fold var(--t) cubic-bezier(.6,0,.3,1) infinite;transform-origin:50% 50%;backface-visibility:hidden}.paper-fold-shade{animation:paper-fold-shade var(--t) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.paper-fold-top,.paper-fold-shade{animation:none}}`}</style>
      <p
        aria-label={text}
        className="grid font-heading text-5xl font-black text-(--em-ink-50) sm:text-7xl"
        style={{ "--t": `${speed}s` } as CSSProperties}
      >
        <span aria-hidden className={`${half} [clip-path:inset(50%_0_0_0)]`}>
          {text}
        </span>
        <span
          aria-hidden
          className={`${half} paper-fold-shade vt-live bg-(--em-ink-975) [clip-path:inset(50%_0_0_0)]`}
        />
        <span aria-hidden className={`${half} paper-fold-top vt-live [clip-path:inset(0_0_50%_0)]`}>
          {text}
        </span>
      </p>
    </div>
  );
}
