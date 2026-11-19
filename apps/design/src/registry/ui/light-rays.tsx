import type { CSSProperties } from "react";

/** Rays of light come through the surface as a fan and turn slowly (rotate + opacity only). */
export default function LightRays({ rays = 12, speed = 30 }: { rays?: number; speed?: number }) {
  return (
    <div className="relative size-full min-h-56 overflow-hidden bg-linear-to-b from-(--em-blue-800) to-(--em-ink-975)">
      <style>{`@keyframes light-rays-sway{0%,100%{transform:translateX(-50%) rotate(-8deg)}50%{transform:translateX(-50%) rotate(8deg)}}@keyframes light-rays-breathe{0%,100%{opacity:.25}50%{opacity:.6}}.light-rays-fan{animation:light-rays-sway var(--t) ease-in-out infinite}.light-rays-ray{animation:light-rays-breathe calc(var(--t)/5) ease-in-out infinite}@media (prefers-reduced-motion:reduce){.light-rays-fan,.light-rays-ray{animation:none}}`}</style>
      <div
        aria-hidden
        className="light-rays-fan vt-live absolute -top-[10%] left-1/2 h-[140%] w-0 origin-top"
        style={{ "--t": `${speed}s` } as CSSProperties}
      >
        {Array.from({ length: rays }, (_, i) => (
          <span
            key={i}
            className="light-rays-ray absolute top-0 left-0 h-full w-10 origin-top -translate-x-1/2 bg-linear-to-b from-(--em-sky-400)/70 to-transparent blur-md"
            style={{
              rotate: `${(i - (rays - 1) / 2) * (70 / rays)}deg`,
              animationDelay: `${(i * 0.7) % 3}s`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-6 bg-(--em-sky-400)/20 blur-sm" aria-hidden />
    </div>
  );
}
