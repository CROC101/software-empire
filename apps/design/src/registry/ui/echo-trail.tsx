import type { CSSProperties } from "react";

/** The word sways and fainter copies follow a beat behind, like an echo you can see. */
export default function EchoTrail({
  text = "ECHO",
  echoes = 5,
  distance = 24,
  speed = 2.6,
}: {
  text?: string;
  echoes?: number;
  distance?: number;
  speed?: number;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975) p-6">
      <style>{`@keyframes echo-trail{0%,100%{transform:translate(calc(var(--d)*-1px),0)}50%{transform:translate(calc(var(--d)*1px),calc(var(--d)*-.25px))}}.echo-trail-c{animation:echo-trail var(--t) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.echo-trail-c{animation:none}}`}</style>
      <p aria-label={text} className="grid font-heading text-6xl font-black sm:text-8xl">
        {Array.from({ length: echoes + 1 }, (_, i) => echoes - i).map((k) => (
          <span
            key={k}
            aria-hidden
            className={`echo-trail-c vt-live col-start-1 row-start-1 whitespace-nowrap ${k === 0 ? "text-(--em-ink-50)" : "text-(--em-blue-500)"}`}
            style={
              {
                "--d": distance,
                "--t": `${speed}s`,
                animationDelay: `${k * 0.09}s`,
                opacity: k === 0 ? 1 : 0.5 * (1 - k / (echoes + 1)),
              } as CSSProperties
            }
          >
            {text}
          </span>
        ))}
      </p>
    </div>
  );
}
