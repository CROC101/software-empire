import type { CSSProperties } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/** A bend runs through the word like heat haze: each letter leans and stretches a beat after the last. */
export default function BendText({
  text = "WARP SPEED",
  amount = 18,
  speed = 2.4,
}: {
  text?: string;
  amount?: number;
  speed?: number;
}) {
  const chars = graphemes(text);
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 [perspective:600px]">
      <style>{`@keyframes bend-text{0%,100%{transform:skewX(0) scaleY(1)}50%{transform:skewX(calc(var(--a)*-1deg)) scaleY(1.25)}}.bend-text-c{animation:bend-text var(--t) ease-in-out infinite;transform-origin:50% 100%}@media (prefers-reduced-motion:reduce){.bend-text-c{animation:none}}`}</style>
      <p
        aria-label={text}
        className="font-heading text-5xl font-black text-(--em-ink-50) [transform:rotateX(18deg)] sm:text-7xl"
      >
        {chars.map((c, i) => (
          <span
            key={i}
            aria-hidden
            className="bend-text-c vt-live inline-block whitespace-pre"
            style={
              {
                "--a": amount,
                "--t": `${speed}s`,
                animationDelay: `${(i * speed) / Math.max(chars.length, 1) / 2}s`,
              } as CSSProperties
            }
          >
            {c}
          </span>
        ))}
      </p>
    </div>
  );
}
