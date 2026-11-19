import type { CSSProperties } from "react";

const graphemes = (s: string) =>
  [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

/** Each letter bobs up and down a little after the one before it, so a wave runs through the word. */
export default function WavyText({
  text = "คลื่นลูกเล็ก",
  height = 8,
}: {
  text?: string;
  height?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes wavy-text-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(var(--h) * -1))}}.wavy-text-g{animation:wavy-text-bob 1.6s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.wavy-text-g{animation:none}}`}</style>
      <p
        aria-label={text}
        className="font-heading text-4xl font-black text-(--em-sky-400) sm:text-6xl"
      >
        {graphemes(text).map((g, i) => (
          <span
            key={i}
            aria-hidden
            className="wavy-text-g vt-live inline-block whitespace-pre"
            style={{ "--h": `${height}px`, animationDelay: `${i * 0.08}s` } as CSSProperties}
          >
            {g}
          </span>
        ))}
      </p>
    </div>
  );
}
