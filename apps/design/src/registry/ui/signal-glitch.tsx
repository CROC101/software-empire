import type { CSSProperties } from "react";

/**
 * A broken broadcast: two tinted copies of the word slip sideways in thin bands that jump every few
 * frames. Set "hover" to only glitch while the pointer is on it.
 */
export default function SignalGlitch({
  text = "GLITCH",
  speed = 2,
  hover = false,
}: {
  text?: string;
  speed?: number;
  hover?: boolean;
}) {
  const copy = "signal-glitch-c vt-live pointer-events-none col-start-1 row-start-1";
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <style>{`@keyframes signal-glitch-a{0%{clip-path:inset(10% 0 80% 0);transform:translateX(-4px)}20%{clip-path:inset(60% 0 20% 0);transform:translateX(5px)}40%{clip-path:inset(30% 0 55% 0);transform:translateX(-3px)}60%{clip-path:inset(80% 0 5% 0);transform:translateX(4px)}80%{clip-path:inset(45% 0 40% 0);transform:translateX(-5px)}100%{clip-path:inset(5% 0 90% 0);transform:translateX(2px)}}@keyframes signal-glitch-b{0%{clip-path:inset(70% 0 10% 0);transform:translateX(4px)}25%{clip-path:inset(15% 0 70% 0);transform:translateX(-4px)}50%{clip-path:inset(50% 0 35% 0);transform:translateX(3px)}75%{clip-path:inset(25% 0 60% 0);transform:translateX(-2px)}100%{clip-path:inset(85% 0 2% 0);transform:translateX(5px)}}.signal-glitch-c{opacity:0}.signal-glitch:not([data-hover]) .signal-glitch-c,.signal-glitch[data-hover]:hover .signal-glitch-c{opacity:.85;animation:signal-glitch-a var(--t) steps(1) infinite}.signal-glitch:not([data-hover]) .signal-glitch-b,.signal-glitch[data-hover]:hover .signal-glitch-b{animation-name:signal-glitch-b}@media (prefers-reduced-motion:reduce){.signal-glitch .signal-glitch-c{animation:none!important;opacity:0!important}}`}</style>
      <p
        data-hover={hover || undefined}
        aria-label={text}
        className="signal-glitch grid font-heading text-6xl font-black text-(--em-ink-50) sm:text-8xl"
        style={{ "--t": `${speed}s` } as CSSProperties}
      >
        <span aria-hidden className="col-start-1 row-start-1">
          {text}
        </span>
        <span aria-hidden className={`${copy} text-(--em-sky-400)`}>
          {text}
        </span>
        <span aria-hidden className={`${copy} signal-glitch-b text-(--em-blue-600)`}>
          {text}
        </span>
      </p>
    </div>
  );
}
